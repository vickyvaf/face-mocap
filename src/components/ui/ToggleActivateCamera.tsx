import { Camera, CameraOff } from "lucide-react";
import { useState } from "react";
import { setCameraActive } from "../../utils/faceStore";

export const ToggleActivateCamera = () => {
  const [isActive, setIsActive] = useState(false);

  const toggleCamera = () => {
    const newState = !isActive;
    setIsActive(newState);
    setCameraActive(newState);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 50,
      }}
    >
      <button
        style={{
          padding: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={toggleCamera}
      >
        {isActive ? <Camera /> : <CameraOff />}
      </button>
    </div>
  );
};
