import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
import { Scene } from "./Scene";
import { ChatBox } from "./ChatBox";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  playerId: string;
  message: string;
  timestamp: number;
}

interface ChatLog {
  messages: ChatMessage[];
}

interface Player {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  lastChatMessage?: ChatMessage;
}

const keyboardMap = [
  { name: "forward", keys: ["w", "W"] },
  { name: "backward", keys: ["s", "S"] },
  { name: "left", keys: ["a", "A"] },
  { name: "right", keys: ["d", "D"] },
  { name: "jump", keys: [" "] },
];

const App: React.FC = () => {
  console.log("RENDERING APP");
  const [isConnected, setIsConnected] = useState(false);
  const [serverFull, setServerFull] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatLog, setChatLog] = useState<ChatLog>({ messages: [] });
  const socket = useRef<WebSocket>();
  const id = useRef<string>("");

  if (serverFull) {
    return <div>Server is full</div>;
  }

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:8080");
    console.log("SOCKET CREATED");

    socket.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    socket.current.onmessage = (event) => {
      console.log("RECEIVED WEBSOCKET MESSAGE", event.data);
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "state":
          console.log("UPDATING PLAYERS STATE", data.payload);
          setPlayers(data.payload);
          break;
        case "id":
          console.log("RECEIVED PLAYER ID", data.payload);
          id.current = data.payload;
          break;
        case "serverFull":
          console.log("SERVER IS FULL", data.payload);
          setServerFull(true);
          break;
        case "chatLog":
          console.log("RECEIVED CHAT LOG", data.payload);
          setChatLog(data.payload);
          break;
        default:
          console.log("RECEIVED UNKNOWN MESSAGE TYPE", data.type);
      }
    };

    socket.current.onclose = () => {
      console.log("WEBSOCKET CONNECTION CLOSED");
      setIsConnected(false);
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  if (!isConnected) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <KeyboardControls map={keyboardMap}>
        <Canvas
          style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "skyblue",
          }}
        >
          <Physics interpolate={true} gravity={[0, 0, 0]}>
            <Scene
              socket={socket.current!}
              playerId={id.current}
              players={players}
            />
          </Physics>
        </Canvas>
        <ChatBox
          socket={socket.current!}
          playerId={id.current}
          chatLog={chatLog}
        />
      </KeyboardControls>
    </div>
  );
};

export default App;
