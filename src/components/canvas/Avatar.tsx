import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Group } from "three";
import { faceData } from "../../utils/faceStore";

useGLTF.preload("/face-mocap.glb");

export const Avatar = forwardRef<Group, React.JSX.IntrinsicElements["group"]>(
  (props, ref) => {
    const group = useRef<Group>(null);
    const { nodes, animations } = useGLTF("/face-mocap.glb");
    const { actions, names } = useAnimations(animations, group);

    useImperativeHandle(ref, () => group.current as Group);

    useEffect(() => {
      if (names.length > 0) {
        actions[names[0]]?.reset().fadeIn(0.5).play();
        actions[names[1]]?.reset().fadeIn(0.5).play();
      }
      return () => {
        actions[names[0]]?.fadeOut(0.5);
        actions[names[1]]?.fadeOut(0.5);
      };
    }, [actions, names]);

    useFrame(() => {
      const { head } = faceData;

      if (nodes.body) {
        nodes.body.rotation.set(head.x, head.y, head.z);
        // nodes.eye.rotation.set(head.x, head.y, head.z);
      }
    });

    return (
      <group ref={group} {...props} dispose={null}>
        <primitive object={nodes.body} />
        {/* <primitive object={nodes.eye} /> */}
        <primitive object={nodes.lips} />
      </group>
    );
  }
);

Avatar.displayName = "Avatar";
