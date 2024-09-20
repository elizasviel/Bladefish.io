import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
import { Scene } from "./Scene";

console.log("App.tsx: Importing dependencies");

const keyboardMap = [
  { name: "forward", keys: ["w", "W"] },
  { name: "backward", keys: ["s", "S"] },
  { name: "left", keys: ["a", "A"] },
  { name: "right", keys: ["d", "D"] },
  { name: "jump", keys: [" "] },
];

console.log("App.tsx: Keyboard map defined", keyboardMap);

console.log("App.tsx: Player interface defined");

const App: React.FC = () => {
  console.log("App: Component rendering");
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
            <Scene />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

console.log("App.tsx: Exporting App component");

export default App;
