import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, OrbitControls } from "@react-three/drei";

console.log("App.tsx: Importing dependencies");

const keyboardMap = [
  { name: "forward", keys: ["w", "W"] },
  { name: "backward", keys: ["s", "S"] },
  { name: "left", keys: ["a", "A"] },
  { name: "right", keys: ["d", "D"] },
  { name: "jump", keys: [" "] },
];

console.log("App.tsx: Keyboard map defined", keyboardMap);

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

console.log("App.tsx: Player interface defined");

const Scene: React.FC = () => {
  console.log("Scene: Component rendering");
  const socket = useRef<WebSocket>();
  const id = useRef<string>("");
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    console.log("Scene: useEffect hook running");
    socket.current = new WebSocket("ws://localhost:8080");
    console.log("Scene: WebSocket instance created");

    socket.current.onopen = () => {
      console.log("Scene: WebSocket connection opened");
      console.log("Scene: Sending getInitialState request");
      socket.current?.send(JSON.stringify({ type: "getInitialState" }));
      console.log("Scene: Sending createPlayer request");
      socket.current?.send(JSON.stringify({ type: "createPlayer" }));
    };

    socket.current.onmessage = (event) => {
      console.log("Scene: Received WebSocket message", event.data);
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "state":
          console.log("Scene: Updating players state", data.data);
          setPlayers(data.data);
          break;
        case "id":
          console.log("Scene: Received player ID", data.data);
          id.current = data.data;
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

const App: React.FC = () => {
  console.log("App: Component rendering");
  return (
    <div>
      <KeyboardControls map={keyboardMap}>
        <Canvas
          frameloop="demand"
          style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "skyblue",
          }}
        >
          <Physics interpolate={true} gravity={[0, -9.81, 0]}>
            <Scene />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

console.log("App.tsx: Exporting App component");
export default App;
