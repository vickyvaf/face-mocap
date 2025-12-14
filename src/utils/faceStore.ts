// Simple global store for face tracking data
// We read this in useFrame directly

export const faceData = {
    // Rotation values in radians or normalized units
    // x: vertical (pitch), y: horizontal (yaw)
    eyeLeft: { x: 0, y: 0 },
    eyeRight: { x: 0, y: 0 },
    head: { x: 0, y: 0, z: 0 }
};

// Helper to update data
export const updateFaceData = (
    leftEyeX: number, leftEyeY: number, 
    rightEyeX: number, rightEyeY: number,
    headX: number, headY: number, headZ: number
) => {
    faceData.eyeLeft.x = leftEyeX;
    faceData.eyeLeft.y = leftEyeY;
    
    faceData.eyeRight.x = rightEyeX;
    faceData.eyeRight.y = rightEyeY;

    faceData.head.x = headX;
    faceData.head.y = headY;
    faceData.head.z = headZ;
};

// Camera State Management
type CameraListener = (isActive: boolean) => void;
const listeners: CameraListener[] = [];

export const cameraState = {
    isActive: false
};

export const setCameraActive = (active: boolean) => {
    cameraState.isActive = active;
    listeners.forEach(l => l(active));
};

export const subscribeToCameraState = (listener: CameraListener) => {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
};
