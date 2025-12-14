import { Camera } from "@mediapipe/camera_utils";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Eye, Rotate3d } from "lucide-react";
import { useEffect, useRef } from "react";
import { Matrix4, Euler } from "three";
import { subscribeToCameraState, updateFaceData } from "../../utils/faceStore";

export const FaceTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const cameraInstanceRef = useRef<Camera | null>(null); // Store camera instance
  const lastTime = useRef(Date.now());
  const frameCount = useRef(0);

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
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );

      // Initial check (maybe start if default is true, but default is false)
      // We wait for subscription to trigger start
    };

    const startCamera = () => {
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.start();
        return;
      }

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          // Calculate FPS
          frameCount.current++;
          const now = Date.now();
          if (now - lastTime.current >= 1000) {
            frameCount.current = 0;
            lastTime.current = now;
          }

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
              // Drawing Mouth (Blue)
              // ----------------------------------------------------
              const mouthIndices = [
                0, // Top
                17, // Bottom
                61, // Left
                291, // Right
              ];

              canvasCtx.fillStyle = "#FF0000";
              mouthIndices.forEach((index) => {
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
              // Drawing Nose (Yellow)
              // ----------------------------------------------------
              const noseIndices = [1];
              canvasCtx.fillStyle = "#FF0000";
              noseIndices.forEach((index) => {
                const point = landmarks[index];
                canvasCtx.beginPath();
                canvasCtx.arc(
                  point.x * canvasElement.width,
                  point.y * canvasElement.height,
                  3,
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

              // Restore context to draw text normally (Unmirrored)
              canvasCtx.restore();

              // ----------------------------------------------------
              // Calculations & Store Update
              // ----------------------------------------------------
              // Calculate Head Rotation from Matrix
              let headX = 0,
                headY = 0,
                headZ = 0;
              if (
                results.facialTransformationMatrixes &&
                results.facialTransformationMatrixes.length > 0
              ) {
                const matrix = new Matrix4().fromArray(
                  results.facialTransformationMatrixes[0].data
                );
                const rotation = new Euler().setFromRotationMatrix(matrix);
                headX = rotation.x;
                headY = rotation.y;
                headZ = rotation.z;
              }

              // Reverted custom inversion. Now using positive GazeX.
              // Since we are mirroring the visual, Left Look -> Image Left.
              // GazeX Positive -> Left.
              const ROTATION_MULTIPLIER = 0.5;
              updateFaceData(
                gazeX * ROTATION_MULTIPLIER,
                gazeY * ROTATION_MULTIPLIER,
                gazeX * ROTATION_MULTIPLIER,
                gazeY * ROTATION_MULTIPLIER,
                headX,
                headY,
                headZ
              );

              // 2. Eyelid Openness
              const blinkAvg =
                (getScore("eyeBlinkLeft") + getScore("eyeBlinkRight")) / 2;
              const wideAvg =
                (getScore("eyeLookUpLeft") + getScore("eyeLookUpRight")) / 2;
              Math.max(0, 1 - blinkAvg + wideAvg);
            } else {
              canvasCtx.restore(); // Ensure context is restored even if no landmarks
            }
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
      cameraInstanceRef.current = camera;
    };

    setupFaceLandmarker();

    // Subscribe to global camera state
    const unsubscribe = subscribeToCameraState((isActive) => {
      if (isActive) {
        if (faceLandmarkerRef.current) {
          startCamera();
        }
      } else {
        if (cameraInstanceRef.current) {
          // @ts-ignore - stop() exists on the instance usually but might be missing in strict types
          try {
            cameraInstanceRef.current.stop();
          } catch (e) {}
        }
      }
    });

    return () => {
      unsubscribe();
      videoElement.srcObject = null;
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (cameraInstanceRef.current) {
        try {
          cameraInstanceRef.current.stop();
        } catch (e) {}
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

      {/* TODO: Add controls */}
      {/* <FaceControl /> */}
    </div>
  );
};

function FaceControl() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "12px",
      }}
    >
      <button
        style={{
          padding: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Rotate3d size={20} />
      </button>
      <button
        style={{
          padding: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Eye size={20} />
      </button>
      <button
        style={{
          padding: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="200" height="200" rx="20" />
          <path
            d="M25 55 C25 70 75 70 75 55 L25 55"
            stroke="white"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}
