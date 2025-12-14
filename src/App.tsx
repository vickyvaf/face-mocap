import {
  Environment,
  Html,
  OrbitControls,
  useProgress,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Avatar } from "./components/canvas/Avatar";
import { FaceTracker } from "./components/canvas/FaceTracker";

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

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#FFDAB9",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        style={{ flex: 1, position: "relative", borderRight: "2px solid #333" }}
      >
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
            <Avatar position={[0, -1.5, 0]} />
          </Suspense>
          <OrbitControls makeDefault />
          <InitCamera />
        </Canvas>
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FaceTracker />
      </div>
    </div>
  );
}

export default App;
