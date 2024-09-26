import * as THREE from "three";
import { Model as SharkModel } from "./assets/Shark.tsx";
import { Billboard, Text } from "@react-three/drei";

interface Enemy {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  health: number;
  currentAction: string;
}

export const Enemy: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const position = new THREE.Vector3(
    enemy.position.x,
    enemy.position.y,
    enemy.position.z
  );
  const quaternion = new THREE.Quaternion(
    enemy.rotation.x,
    enemy.rotation.y,
    enemy.rotation.z,
    enemy.rotation.w
  );

  const healthPercentage = enemy.health / 50; // Assuming max health is 100

  return (
    <group>
      <SharkModel position={position} quaternion={quaternion} enemy={enemy} />
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[position.x, position.y + 2, position.z]} // Adjust the Y value to position the health bar above the shark
      >
        <mesh>
          <planeGeometry args={[2, 0.2]} />
          <meshBasicMaterial color="gray" />
        </mesh>
        <mesh
          position={[-1 + healthPercentage, 0, 0.01]}
          scale={[healthPercentage * 2, 1, 1]}
        >
          <planeGeometry args={[1, 0.2]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${Math.round(healthPercentage * 100)}%`}
        </Text>
      </Billboard>
    </group>
  );
};
