import React, { Suspense } from "react";
import { Player } from "./Player";
import { Plane } from "@react-three/drei";

export const Scene: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.5} />
      <Player />
      <Plane
        args={[100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
      >
        <meshStandardMaterial color="#8a8a8a" />
      </Plane>
    </Suspense>
  );
};
