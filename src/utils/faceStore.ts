// Simple global store for face tracking data
// We read this in useFrame directly

export const faceData = {
    // Rotation values in radians or normalized units
    // x: vertical (pitch), y: horizontal (yaw)
    eyeLeft: { x: 0, y: 0 },
    eyeRight: { x: 0, y: 0 }
};

// Helper to update data
export const updateFaceData = (leftEyeX: number, leftEyeY: number, rightEyeX: number, rightEyeY: number) => {
    faceData.eyeLeft.x = leftEyeX;
    faceData.eyeLeft.y = leftEyeY;
    
    faceData.eyeRight.x = rightEyeX;
    faceData.eyeRight.y = rightEyeY;
};
