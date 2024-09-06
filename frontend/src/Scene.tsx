import React, { Suspense, useState, useEffect } from "react";
import { Player } from "./Player";
import { useWebSocket } from "./WebSocketContext";
import { useKeyboardControls } from "./useKeyboardControls";

interface PlayerData {
  id: string;
  position: { x: number; y: number; z: number };
}

export const Scene: React.FC = () => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const { socket, isConnected, playerId } = useWebSocket();

  useKeyboardControls();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        setPlayers(message.data);
      }
    };

    socket.addEventListener("message", handleMessage);

    // Request initial state
    socket.send(JSON.stringify({ type: "getInitialState" }));

    // Request player creation if we don't have a player ID yet
    if (!playerId) {
      socket.send(JSON.stringify({ type: "createPlayer" }));
    }

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, isConnected, playerId]);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      {players.map((player) => (
        <Player key={player.id} position={player.position} />
      ))}
    </Suspense>
  );
};
