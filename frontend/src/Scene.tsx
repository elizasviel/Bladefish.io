import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
interface Position {
  x: number;
  y: number;
  z: number;
}

interface Rotation {
  x: number;
  y: number;
  z: number;
}

interface Player {
  id: string;
  position: Position;
  rotation: Rotation;
}

const Scene = () => {
  const socket = useRef<WebSocket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("WebSocket connected");
      socket.current = ws;
      ws.send(JSON.stringify({ type: "createPlayer" }));
      ws.send(JSON.stringify({ type: "getInitialState" }));
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "state":
          console.log("State received:", data.data);
          setPlayers(data.data);
          break;
        case "id":
          console.log("ID received:", data.data);
          setPlayerId(data.data);
          break;
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      socket.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (socket.current && playerId) {
        let movement = { x: 0, y: 0, z: 0 };
        switch (e.key) {
          case "w":
            movement.x = 1;
            break;
          case "s":
            movement.x = -1;
            break;
          case "a":
            movement.z = 1;
            break;
          case "d":
            movement.z = -1;
            break;
        }
        if (movement.x !== 0 || movement.z !== 0) {
          socket.current.send(
            JSON.stringify({
              type: "playerMovement",
              data: {
                id: playerId,
                position: movement,
                rotation: { x: 0, y: 0, z: 0 },
              },
            })
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <group>
      {players.map((player) => (
        <mesh
          key={player.id}
          position={
            new Vector3(player.position.x, player.position.y, player.position.z)
          }
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={player.id === playerId ? "red" : "hotpink"}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Scene;
