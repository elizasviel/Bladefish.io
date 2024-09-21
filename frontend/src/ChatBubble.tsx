import { useState, useEffect } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";

export const ChatBubble: React.FC<{ message: string | undefined }> = ({
  message,
}) => {
  if (!message) return null;

  const [bubbleSize, setBubbleSize] = useState({ width: 2.2, height: 1.2 });

  useEffect(() => {
    // Calculate the size based on the message length
    const minWidth = 2.2;
    const minHeight = 1.2;
    const charsPerLine = 10;
    const linesPerUnit = 2;

    const lines = Math.ceil(message.length / charsPerLine);
    const width = Math.max(minWidth, message.length * 0.2);
    const height = Math.max(minHeight, lines / linesPerUnit);

    setBubbleSize({ width, height });
  }, [message]);

  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <group position={[0, 2, 0]}>
        {/* Front text */}
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.5}
          maxWidth={bubbleSize.width - 0.4}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="black"
          overflowWrap="break-word"
        >
          {message}
          <meshStandardMaterial color="black" side={THREE.DoubleSide} />
        </Text>

        <RoundedRectangle
          width={bubbleSize.width}
          height={bubbleSize.height}
          radius={0.2}
          depth={0.01}
        />
        <TriangularPoint
          width={0.3}
          height={0.3}
          depth={0.01}
          position={[-bubbleSize.width * 0.25, -bubbleSize.height / 2, 0]}
        />
      </group>
    </Billboard>
  );
};

const RoundedRectangle: React.FC<{
  width: number;
  height: number;
  radius: number;
  depth: number;
}> = ({ width, height, radius, depth }) => {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.2,
    bevelSize: radius * 0.5,
    bevelSegments: 16,
  };

  return (
    <mesh>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="white" side={THREE.DoubleSide} />
    </mesh>
  );
};

const TriangularPoint: React.FC<{
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
}> = ({ width, height, depth, position }) => {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, -height);
  shape.lineTo(-width / 2, 0);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: false,
  };

  return (
    <mesh position={position}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="white" side={THREE.DoubleSide} />
    </mesh>
  );
};
