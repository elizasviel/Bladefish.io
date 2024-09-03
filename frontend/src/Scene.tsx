import React, { Suspense, useMemo, useState, useEffect } from "react";
import { Player } from "./Player";
import {
  Sphere,
  Box,
  Cylinder,
  Portal,
  MeshPortalMaterial,
  shaderMaterial,
} from "@react-three/drei";
import { useWebSocket } from "./WebSocketContext";
import { extend, useFrame } from "@react-three/fiber";

interface PlayerData {
  id: string;
  position: { x: number; y: number; z: number };
}

const PortalRaysMaterial = shaderMaterial(
  { time: 0, color: [0, 1, 1] },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float alpha = smoothstep(0.5, 0.4, dist) * (0.5 + 0.5 * sin(dist * 40.0 - time * 2.0));
      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ PortalRaysMaterial });

export const Scene: React.FC = () => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const { socket, isConnected } = useWebSocket();
  const [localPlayer, setLocalPlayer] = useState<PlayerData>({
    id: "local",
    position: { x: 0, y: 0, z: 0 },
  });

  const seaweed = useMemo(() => generateSeaweed(20), []);
  const rocks = useMemo(() => generateRocks(10), []);

  const portalRaysMaterialRef = React.useRef();

  useFrame((state) => {
    if (portalRaysMaterialRef.current) {
      portalRaysMaterialRef.current.time = state.clock.getElapsedTime();
    }
  });

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "players") {
          setPlayers(data.players.filter((p: PlayerData) => p.id !== "local"));
        }
      };
    }
  }, [socket]);

  useEffect(() => {
    if (isConnected) {
      socket?.send(JSON.stringify({ type: "join", data: localPlayer }));
    }
  }, [isConnected, localPlayer, socket]);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Player
        key={localPlayer.id}
        position={localPlayer.position}
        isLocal={true}
        onPositionUpdate={(pos) => {
          setLocalPlayer((prev) => ({ ...prev, position: pos }));
          socket?.send(JSON.stringify({ type: "position", data: pos }));
        }}
      />
      {players.map((player) => (
        <Player key={player.id} position={player.position} isLocal={false} />
      ))}

      {/* Ocean floor */}
      <Box args={[100, 1, 100]} position={[0, -5, 0]}>
        <meshStandardMaterial color="#1e3d59" />
      </Box>

      {/* Seaweed */}
      {seaweed}

      {/* Rocks */}
      {rocks}

      {/* Portal */}
      <group position={[10, 0, 0]}>
        {/* Portal border */}
        <mesh>
          <ringGeometry args={[1.9, 2.1, 64]} />
          <meshBasicMaterial color="#00ffff" toneMapped={false} />
        </mesh>

        {/* Portal rays */}
        <mesh>
          <ringGeometry args={[1.5, 3, 64]} />
          {/* @ts-ignore */}
          <portalRaysMaterial
            ref={portalRaysMaterialRef}
            color={[0, 1, 1]}
            transparent
          />
        </mesh>

        {/* Portal content */}
        <mesh>
          <circleGeometry args={[2, 64]} />
          <MeshPortalMaterial>
            <color attach="background" args={["lightblue"]} />
            <ambientLight intensity={1} />
            <pointLight position={[0, 0, 0]} intensity={5} color="lightblue" />
            <Box position={[0, 0, -5]}>
              <meshStandardMaterial color="hotpink" />
            </Box>
          </MeshPortalMaterial>
        </mesh>

        {/* Emissive glow */}
        <pointLight
          position={[0, 0, 0.1]}
          distance={5}
          intensity={5}
          color="#00ffff"
        />
      </group>
    </Suspense>
  );
};

function generateSeaweed(count: number) {
  return [...Array(count)].map((_, index) => (
    <Cylinder
      key={`seaweed-${index}`}
      args={[0.1, 0.1, 3 + Math.random() * 2, 8]}
      position={[
        -20 + Math.random() * 40,
        -3.5 + (3 + Math.random() * 2) / 2,
        -20 + Math.random() * 40,
      ]}
      rotation={[Math.random() * 0.2, 0, Math.random() * 0.2]}
    >
      <meshStandardMaterial color="#2ecc71" />
    </Cylinder>
  ));
}

function generateRocks(count: number) {
  return [...Array(count)].map((_, index) => (
    <Sphere
      key={`rock-${index}`}
      args={[1 + Math.random() * 2, 8, 8]}
      position={[
        -30 + Math.random() * 60,
        -4.5 + Math.random(),
        -30 + Math.random() * 60,
      ]}
    >
      <meshStandardMaterial color="#7f8c8d" />
    </Sphere>
  ));
}
