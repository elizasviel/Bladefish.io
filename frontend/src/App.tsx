import React from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
import { WebSocketProvider } from "./WebSocketContext";
import { Scene } from "./Scene";

const keyboardMap = [
  { name: "forward", keys: ["w", "W"] },
  { name: "backward", keys: ["s", "S"] },
  { name: "left", keys: ["a", "A"] },
  { name: "right", keys: ["d", "D"] },
  { name: "jump", keys: [" "] },
];

const App: React.FC = () => {
  return (
    <WebSocketProvider>
      <div>
        <KeyboardControls map={keyboardMap}>
          <Canvas
            frameloop="demand"
            style={{
              width: "100vw",
              height: "100vh",
              backgroundColor: "steelblue",
            }}
          >
            <Physics interpolate={true} gravity={[0, 0, 0]}>
              <Scene />
            </Physics>
          </Canvas>
        </KeyboardControls>
      </div>
    </WebSocketProvider>
  );
};

export default App;
