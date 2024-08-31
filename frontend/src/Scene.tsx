import React, { Suspense, useMemo, useState, useEffect } from "react";
import { Player } from "./Player";
import { Sphere, Box, Cylinder } from "@react-three/drei";
import { useWebSocket } from "./WebSocketContext";

interface PlayerData {
  id: string;
  position: { x: number; y: number; z: number };
}

export const Scene: React.FC = () => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const { socket, isConnected } = useWebSocket();
  const [localPlayer, setLocalPlayer] = useState<PlayerData>({
    id: "local",
    position: { x: 0, y: 0, z: 0 },
  });

  const seaweed = useMemo(() => generateSeaweed(20), []);
  const rocks = useMemo(() => generateRocks(10), []);

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
      <ambientLight intensity={0.3} />
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
