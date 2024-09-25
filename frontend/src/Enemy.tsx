import * as THREE from "three";
import { Model as SharkModel } from "./assets/Shark.tsx";

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
  return <SharkModel position={position} quaternion={quaternion}></SharkModel>;
};
