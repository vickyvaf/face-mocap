import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { Group, MathUtils } from "three";

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
      console.log("Available animations:", names);
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

    // We can use refs to access the specific meshes directly if needed,
    // but since they are in `nodes`, we can access them directly there too.
    // However, `nodes` objects are reused. It's safe to mutate them for rotation
    // if this is the only instance, or we should clone them.
    // For this simple case, direct mutation is fine as per R3F patterns for single models.

    useFrame((state) => {
      if (nodes.eye_left && nodes.eye_right) {
        // Pointer x/y are normalized (-1 to 1)
        const targetX = state.pointer.y * 0.5; // Look up/down (inverted)
        const targetY = state.pointer.x * 0.5; // Look left/right (inverted)

        // Smooth interpolation
        nodes.eye_left.rotation.x = MathUtils.lerp(
          nodes.eye_left.rotation.x,
          targetX,
          0.1
        );
        nodes.eye_left.rotation.y = MathUtils.lerp(
          nodes.eye_left.rotation.y,
          targetY,
          0.1
        );

        nodes.eye_right.rotation.x = MathUtils.lerp(
          nodes.eye_right.rotation.x,
          targetX,
          0.1
        );
        nodes.eye_right.rotation.y = MathUtils.lerp(
          nodes.eye_right.rotation.y,
          targetY,
          0.1
        );
      }
    });

    // Access geometry to modify edges/faces
    useFrame(() => {
      // Example of accessing geometry (do not log in loop!)
    });

    // One-time log to see geometry structure
    useEffect(() => {
      if (nodes.eye_left) {
        const mesh = nodes.eye_left as THREE.Mesh;
        if (mesh.geometry) {
          console.log("Eye Geometry:", mesh.geometry);
          console.log("Vertices:", mesh.geometry.attributes.position);
        } else {
          console.log("Eye Left is not a Mesh (likely a Group):", mesh);
        }
      }
    }, [nodes]);

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
