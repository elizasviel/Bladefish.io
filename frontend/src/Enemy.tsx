import * as THREE from "three";

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
  return (
    <mesh
      position={
        new THREE.Vector3(enemy.position.x, enemy.position.y, enemy.position.z)
      }
      quaternion={
        new THREE.Quaternion(
          enemy.rotation.x,
          enemy.rotation.y,
          enemy.rotation.z,
          enemy.rotation.w
        )
      }
    >
      <boxGeometry args={[5, 5, 5]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
};
