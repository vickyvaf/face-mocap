import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { faceData } from "../../utils/faceStore";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Group } from "three";

useGLTF.preload("/face-mocap.glb");

export const Avatar = forwardRef<Group, React.JSX.IntrinsicElements["group"]>(
  (props, ref) => {
    const group = useRef<Group>(null);
    const { nodes, animations } = useGLTF("/face-mocap.glb");
    const { actions, names } = useAnimations(animations, group);

    // Expose the group ref to parent
    useImperativeHandle(ref, () => group.current as Group);

    // Play all animations by default or log them
    useEffect(() => {
      if (names.length > 0) {
        // Play the first animation found
        actions[names[0]]?.reset().fadeIn(0.5).play();
        actions[names[1]]?.reset().fadeIn(0.5).play();
      }
      return () => {
        actions[names[0]]?.fadeOut(0.5);
        actions[names[1]]?.fadeOut(0.5);
      };
    }, [actions, names]);

    // Apply Real-time Face Data
    useFrame(() => {
      const { eyeLeft, eyeRight } = faceData;

      // Apply rotation to eye bones/meshes
      // Note: Check axis orientation relative to model.
      // Gaze X (Left/Right) usually maps to Y rotation (Yaw)
      // Gaze Y (Up/Down) usually maps to X rotation (Pitch)

      if (nodes.eye_left) {
        nodes.eye_left.rotation.x = eyeLeft.y;
        nodes.eye_left.rotation.y = eyeLeft.x;
      }

      if (nodes.eye_right) {
        nodes.eye_right.rotation.x = eyeRight.y;
        nodes.eye_right.rotation.y = eyeRight.x;
      }
    });

    return (
      <group ref={group} {...props} dispose={null}>
        <primitive object={nodes.body} />
        <group rotation={[0, Math.PI, 0]}>
          <primitive object={nodes.eye_left} />
          <primitive object={nodes.eye_right} />
        </group>
        <primitive object={nodes.lips} />
      </group>
    );
  }
);

Avatar.displayName = "Avatar";
