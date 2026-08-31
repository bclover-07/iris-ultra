"use client";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, Stage, OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";

function StudentAvatar() {
  const group = useRef<any>();

  const { scene, animations } = useGLTF("/images/models/model.glb");
  const { actions } = useAnimations(animations || [], group);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      if (firstAction) firstAction.play();
    }
  }, [actions]);

  return <primitive ref={group} object={scene} scale={1.5} position={[0, -1, 0]} />;
}

export default function Dashboard3DSection() {
  return (
    <div className="w-full h-[500px] bg-transparent">
      <Canvas shadows camera={{ position: [0, 0, 4], fov: 50 }}>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <StudentAvatar />
          <OrbitControls enableZoom={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}