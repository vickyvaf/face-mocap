import {
  Environment,
  Html,
  OrbitControls,
  useProgress,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Play, Square } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Avatar } from "../components/canvas/Avatar";
import { FaceTracker } from "../components/canvas/FaceTracker";
import { setCameraActive } from "../utils/faceStore";

export default function MainScreen() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "var(--background-primary)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
          gap: "20px",
          padding: "20px",
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "#FFF0DB", // Peach/Beige
            borderRadius: "24px",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ width: "100%", height: "100%", position: "absolute" }}>
            <Canvas
              camera={{
                position: DEFAULT_CAMERA_STATE.position,
                fov: 50,
              }}
            >
              <Suspense fallback={<Loader />}>
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={1} />
                <Avatar position={[0, -0.75, -0.5]} />
              </Suspense>
              <OrbitControls makeDefault enableZoom={false} enablePan={false} />
              <InitCamera />
            </Canvas>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "#1a1a1a",
            borderRadius: "24px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaceTracker />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function ToggleButton() {
  const [status, setStatus] = useState<"start" | "stop">("stop");

  return (
    <button
      style={{
        position: "relative",
        left: "-50%",
        transform: "translateX(50%)",
        backgroundColor: status === "start" ? "#FF0000" : undefined,
      }}
      onClick={() => {
        const newState = status === "stop" ? "start" : "stop";
        setCameraActive(status === "stop" ? true : false);
        setStatus(newState);
      }}
    >
      {status === "start" ? <Square size={16} /> : <Play size={16} />}
      {status === "start" ? "Stop" : "Start"}
    </button>
  );
}

function Footer() {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: "20px",
      }}
    >
      <section
        style={{
          fontSize: "12px",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span>Model: face_landmarker.task (v1)</span>
        <span>Library: @mediapipe/tasks-vision (v0.10.22)</span>
      </section>
      <ToggleButton />
    </footer>
  );
}

function Loader() {
  const { progress } = useProgress();
  const [shown, setShown] = useState(0);

  useFrame(() => {
    setShown((current) => {
      const next = current + (progress - current) * 0.1;
      return next > 99.9 ? 100 : next;
    });
  });

  return <Html center>{shown.toFixed(0)} % loaded</Html>;
}

const DEFAULT_CAMERA_STATE = {
  position: new Vector3(-0, -0.5, 1.75),
  target: new Vector3(0, -0.45, -0.15),
};

function InitCamera() {
  const { camera, controls } = useThree();
  const orbitControls = controls as OrbitControlsImpl;

  useEffect(() => {
    if (!controls) return;

    camera.position.set(
      DEFAULT_CAMERA_STATE.position.x,
      DEFAULT_CAMERA_STATE.position.y,
      DEFAULT_CAMERA_STATE.position.z
    );
    orbitControls.target.set(
      DEFAULT_CAMERA_STATE.target.x,
      DEFAULT_CAMERA_STATE.target.y,
      DEFAULT_CAMERA_STATE.target.z
    );
    orbitControls.update();
  }, [camera, controls, orbitControls]);

  return null;
}
