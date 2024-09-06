import React from "react";
import { Vector3 } from "three";

interface PlayerProps {
  position: { x: number; y: number; z: number };
}

export const Player: React.FC<PlayerProps> = ({ position }) => {
  return (
    <mesh position={new Vector3(position.x, position.y, position.z)}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
};
