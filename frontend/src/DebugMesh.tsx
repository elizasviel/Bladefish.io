import React, { useMemo } from "react";
import { BufferGeometry, BufferAttribute, PointsMaterial } from "three";
import { Terrain } from "./Terrain";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface DebugMeshProps {
  debugMeshes: {
    vertices: Float32Array;
    colors: Float32Array;
  };
}

export const DebugMesh: React.FC<DebugMeshProps> = ({ debugMeshes }) => {
  console.log("RENDERING DEBUG MESH", debugMeshes);
  const vertices = new THREE.BufferAttribute(debugMeshes.vertices, 3);
  const colors = new THREE.BufferAttribute(debugMeshes.colors, 4);

  // Create a ref for the mesh
  const meshRef = React.useRef<THREE.Mesh>(null);

  // Update function to set attributes
  const update = () => {
    if (meshRef.current) {
      meshRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(debugMeshes.vertices, 3)
      );
      meshRef.current.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(debugMeshes.colors, 4)
      );
    }
  };

  // Call update function when debugMeshes change
  React.useEffect(() => {
    update();
  }, [debugMeshes]);

  return (
    <>
      <OrbitControls />
      <mesh ref={meshRef} frustumCulled={false}>
        <bufferGeometry />
        <lineBasicMaterial color="red" vertexColors={true} />
      </mesh>
    </>
  );
};
