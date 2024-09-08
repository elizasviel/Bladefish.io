import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";

interface Player {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export const Scene: React.FC = () => {
  console.log("Scene: Component rendering");
  const socket = useRef<WebSocket>();
  const id = useRef<string>("");
  const [players, setPlayers] = useState<Player[]>([]);

  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("Scene: Handling key down event", event);
    switch (event.key) {
      case "w":
        socket.current?.send(
          JSON.stringify({
            type: "playerMovement",
            payload: {
              id: id.current,
              position: { x: 0, y: 0, z: -1 }, // Move forward in 3D space
              rotation: { x: 0, y: 0, z: 0 },
            },
          })
        );
        break;
      case "a":
        socket.current?.send(
          JSON.stringify({
            type: "playerMovement",
            payload: {
              id: id.current,
              position: { x: -1, y: 0, z: 0 }, // Move left in 3D space
              rotation: { x: 0, y: 0, z: 0 },
            },
          })
        );
        break;
      case "s":
        socket.current?.send(
          JSON.stringify({
            type: "playerMovement",
            payload: {
              id: id.current,
              position: { x: 0, y: 0, z: 1 }, // Move backward in 3D space
              rotation: { x: 0, y: 0, z: 0 },
            },
          })
        );
        break;
      case "d":
        socket.current?.send(
          JSON.stringify({
            type: "playerMovement",
            payload: {
              id: id.current,
              position: { x: 1, y: 0, z: 0 }, // Move right in 3D space
              rotation: { x: 0, y: 0, z: 0 },
            },
          })
        );
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    console.log("Scene: useEffect hook running");
    socket.current = new WebSocket("ws://localhost:8080");
    console.log("Scene: WebSocket instance created");

    socket.current.onmessage = (event) => {
      console.log("Scene: Received WebSocket message", event.data);
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "state":
          console.log("Scene: Updating players state", data.payload);
          setPlayers(data.payload);
          break;
        case "id":
          console.log("Scene: Received player ID", data.payload);
          id.current = data.payload;
          break;
        default:
          console.log("Scene: Received unknown message type", data.type);
      }
    };

    socket.current.onclose = () => {
      console.log("Scene: WebSocket connection closed");
    };

    return () => {
      console.log("Scene: Cleaning up WebSocket connection");
      socket.current?.close();
    };
  }, []);

  console.log("Scene: Rendering players", players);
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {players.map((player) => {
        console.log("Scene: Rendering player", player);
        return (
          <mesh
            key={player.id}
            position={[player.position.x, player.position.y, player.position.z]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="red" />
          </mesh>
        );
      })}
    </>
  );
};
