# Face Mocap

A 3D Face Motion Capture application built with React, Three.js, and MediaPipe.

https://github.com/user-attachments/assets/10a1eb48-4762-4791-9db1-82f00a8af9bc

## Features

- **3D Scene**: Renders a GLB avatar (`face-mocap.glb`) in a 3D environment.
- **Component Decomposition**: Separates avatar parts (`body`, `eye_left`, `eye_right`) for individual control.
- **Eye Tracking**: Implements smooth, cursor-based eye tracking using `MathUtils.lerp`.
- **Camera Persistence**: Automatically saves and restores camera position and target to `localStorage`.
- **Debugging**: Includes tools to log camera state and mesh geometry.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: React + Vite + TypeScript
- **3D Engine**: Three.js + React Three Fiber (`@react-three/fiber`)
- **Helpers**: `@react-three/drei`
- **Computer Vision**: [MediaPipe Tasks Vision](https://pjbelo.github.io/mediapipe-js-demos/)

## Getting Started

1.  **Install dependencies**:

    ```bash
    bun install
    ```

2.  **Run development server**:

    ```bash
    bun dev
    ```

3.  **Build for production**:
    ```bash
    bun run build
    ```

## Development Controls

- **Orbit Controls**: Left click to rotate, Right click to pan, Scroll to zoom.
- **Eye Tracking**: Move cursor to have the avatar eyes follow.
- **Camera Logging**: Open console to see camera coordinates when moving.
