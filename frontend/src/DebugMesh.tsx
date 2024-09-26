import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute } from "three";
import * as THREE from "three";

interface DebugMeshProps {
  debugMeshes: {
    vertices: Float32Array;
    colors: Float32Array;
  };
}

export const DebugMesh: React.FC<DebugMeshProps> = ({ debugMeshes }) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    if (geometryRef.current) {
      geometryRef.current.setAttribute(
        "position",
        new BufferAttribute(debugMeshes.vertices, 3)
      );
      geometryRef.current.setAttribute(
        "color",
        new BufferAttribute(debugMeshes.colors, 3)
      );
    }
  });

  return (
    <>
      <lineSegments>
        <bufferGeometry ref={geometryRef}>
          {/* Attributes will be set in the useFrame hook */}
        </bufferGeometry>
        <lineBasicMaterial color="red" vertexColors={true} />
      </lineSegments>
    </>
  );
};
