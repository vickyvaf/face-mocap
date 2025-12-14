import { useRef, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Camera } from "@mediapipe/camera_utils";
import { updateFaceData } from "../../utils/faceStore";

export const FaceTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    const setupFaceLandmarker = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );

      startCamera();
    };

    const startCamera = () => {
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (faceLandmarkerRef.current && videoElement.videoWidth > 0) {
            const results = faceLandmarkerRef.current.detectForVideo(
              videoElement,
              Date.now()
            );

            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            canvasCtx.clearRect(
              0,
              0,
              canvasElement.width,
              canvasElement.height
            );

            // Draw Video (Mirrored)
            canvasCtx.save();
            canvasCtx.translate(canvasElement.width, 0);
            canvasCtx.scale(-1, 1);
            canvasCtx.drawImage(
              videoElement,
              0,
              0,
              canvasElement.width,
              canvasElement.height
            );

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const blendshapes =
                results.faceBlendshapes && results.faceBlendshapes[0]
                  ? results.faceBlendshapes[0].categories
                  : [];

              // ----------------------------------------------------
              // Drawing Iris (Red)
              // ----------------------------------------------------
              const irisIndices = [
                468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
              ];

              canvasCtx.fillStyle = "#FF0000";
              irisIndices.forEach((index) => {
                const point = landmarks[index];
                canvasCtx.beginPath();
                canvasCtx.arc(
                  point.x * canvasElement.width,
                  point.y * canvasElement.height,
                  2,
                  0,
                  2 * Math.PI
                );
                canvasCtx.fill();
              });

              // ----------------------------------------------------
              // Drawing Eyelids (Green)
              // ----------------------------------------------------
              const eyelidIndices = [
                // Left Eye
                33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145,
                144, 163, 7,
                // Right Eye
                362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374,
                380, 381, 382,
              ];

              canvasCtx.fillStyle = "#00FF00";
              eyelidIndices.forEach((index) => {
                const point = landmarks[index];
                canvasCtx.beginPath();
                canvasCtx.arc(
                  point.x * canvasElement.width,
                  point.y * canvasElement.height,
                  1,
                  0,
                  2 * Math.PI
                );
                canvasCtx.fill();
              });

              // ----------------------------------------------------
              // Calculations
              // ----------------------------------------------------
              const getScore = (name: string) => {
                const shape = blendshapes.find((s) => s.categoryName === name);
                return shape ? shape.score : 0;
              };
              // 1. Iris Direction (Gaze)
              const leftEyeMove =
                getScore("eyeLookOutLeft") - getScore("eyeLookInLeft");
              const rightEyeMove =
                getScore("eyeLookInRight") - getScore("eyeLookOutRight");
              const gazeX = (leftEyeMove + rightEyeMove) / 2;

              const leftEyeY =
                getScore("eyeLookUpLeft") - getScore("eyeLookDownLeft");
              const rightEyeY =
                getScore("eyeLookUpRight") - getScore("eyeLookDownRight");
              const gazeY = (leftEyeY + rightEyeY) / 2;

              // Visual Gaze Vector (Inside Mirrored Context)
              const bridge = landmarks[6];
              if (bridge) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(
                  bridge.x * canvasElement.width,
                  bridge.y * canvasElement.height
                );
                canvasCtx.lineTo(
                  (bridge.x + gazeX * 0.2) * canvasElement.width,
                  (bridge.y - gazeY * 0.2) * canvasElement.height
                );
                canvasCtx.strokeStyle = "blue";
                canvasCtx.lineWidth = 4;
                canvasCtx.stroke();
              }

              // Restore context to draw text normally (Unmirrored)
              canvasCtx.restore();

              // ----------------------------------------------------
              // Calculations & Store Update
              // ----------------------------------------------------
              // Reverted custom inversion. Now using positive GazeX.
              // Since we are mirroring the visual, Left Look -> Image Left.
              // GazeX Positive -> Left.
              const ROTATION_MULTIPLIER = 0.5;
              updateFaceData(
                gazeX * ROTATION_MULTIPLIER,
                gazeY * ROTATION_MULTIPLIER,
                gazeX * ROTATION_MULTIPLIER,
                gazeY * ROTATION_MULTIPLIER
              );

              let gazeDir = "CENTER";
              if (gazeX < -0.2) gazeDir = "LEFT";
              else if (gazeX > 0.2) gazeDir = "RIGHT";

              // 2. Eyelid Openness
              const blinkAvg =
                (getScore("eyeBlinkLeft") + getScore("eyeBlinkRight")) / 2;
              const wideAvg =
                (getScore("eyeLookUpLeft") + getScore("eyeLookUpRight")) / 2;
              const eyelidOpenness = Math.max(0, 1 - blinkAvg + wideAvg);
              const eyelid = `${(eyelidOpenness * 100).toFixed(0)}%`;

              // ----------------------------------------------------
              // Visualization Text
              // ----------------------------------------------------
              canvasCtx.font = "30px Arial";
              canvasCtx.fillStyle = "red";
              canvasCtx.fillText(
                `Gaze X: ${gazeX.toFixed(2)} (${gazeDir})`,
                50,
                50
              );
              canvasCtx.fillText(`Eyelid: ${eyelid}`, 50, 100);
            } else {
              canvasCtx.restore(); // Ensure context is restored even if no landmarks
            }
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    };

    setupFaceLandmarker();

    return () => {
      videoElement.srcObject = null;
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        playsInline
      ></video>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      ></canvas>
    </div>
  );
};
