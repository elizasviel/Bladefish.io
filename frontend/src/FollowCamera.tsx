import React, { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { WebGLRenderer } from "three";

interface FollowCameraProps {
  target: { x: number; y: number; z: number };
  gl: WebGLRenderer;
}

export const FollowCamera: React.FC<FollowCameraProps> = ({ target, gl }) => {
  const { camera } = useThree();
  const cameraPosition = useRef(new Vector3(0, 5, 10));
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const targetPosition = new Vector3(target.x, target.y + 2, target.z);
    const offset = new Vector3(
      Math.sin(rotation.y) * 10,
      5,
      Math.cos(rotation.y) * 10
    );
    cameraPosition.current.copy(targetPosition).add(offset);
    camera.position.copy(cameraPosition.current);
    camera.lookAt(targetPosition);
  });

  useEffect(() => {
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const deltaX = event.clientX - lastMousePosition.current.x;
        const deltaY = event.clientY - lastMousePosition.current.y;
        setRotation((prev) => ({
          x: prev.x - deltaY * 0.005,
          y: prev.y - deltaX * 0.005,
        }));
      }
      lastMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const canvas = gl.domElement;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gl, isDragging]);

  return null;
};
