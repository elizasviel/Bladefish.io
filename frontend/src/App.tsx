import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
import { Scene } from "./Scene";
import { Loading } from "./Loading";
import { ChatBox } from "./ChatBox";
import { useState, useRef, useEffect } from "react";

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
  currentAction: string;
  chatBubble: string;
}

interface ChatMessage {
  playerId: string;
  message: string;
  timestamp: number;
}

const keyboardMap = [
  { name: "forward", keys: ["w", "W"] },
  { name: "backward", keys: ["s", "S"] },
  { name: "left", keys: ["a", "A"] },
  { name: "right", keys: ["d", "D"] },
  { name: "spacebar", keys: [" "] },
];

const App: React.FC = () => {
  console.log("RENDERING APP");
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const socket = useRef<WebSocket>();
  const id = useRef<string>("");

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:8080");

    socket.current.onopen = () => {
      console.log("WEBSOCKET CONNECTION OPENED");
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
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  if (!socket.current) {
    return <Loading />;
  } else {
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
            <Scene
              socket={socket.current}
              playerId={id.current}
              players={players}
            />
          </Canvas>
          <ChatBox
            socket={socket.current}
            playerId={id.current}
            chatLog={chatLog}
          />
        </KeyboardControls>
      </div>
    );
  }
};

export default App;
