import { Model as CityScene0 } from "./assets/CityScene0.tsx";
import { MeshPortalMaterial } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

export const Terrain = () => {
  return (
    <>
      <CityScene0 scale={2} position={[-10, -10, -40]} />
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#b69f66" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[20, 15, -49]}>
        <circleGeometry args={[7, 20]}></circleGeometry>
        <MeshPortalMaterial />
      </mesh>
      <RigidBody colliders="trimesh" type="fixed" position={[0, 20, 0]}>
        <mesh>
          <boxGeometry args={[100, 50, 100]}></boxGeometry>
          <meshStandardMaterial
            color="#b69f66"
            transparent={true}
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>
    </>
  );
};
