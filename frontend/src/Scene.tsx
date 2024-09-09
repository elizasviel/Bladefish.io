import { useEffect, useRef, useState } from "react";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
  const { camera } = useThree();
  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("Scene: Handling key down event", event);
    if (!camera) return;

    const direction = new THREE.Vector3();
    const sideDirection = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement on the horizontal plane
    direction.normalize();
    sideDirection.copy(direction).cross(camera.up).normalize();

    let movement: THREE.Vector3;

    switch (event.key) {
      case "w":
        movement = direction.multiplyScalar(1);
        break;
      case "s":
        movement = direction.multiplyScalar(-1);
        break;
      case "a":
        movement = sideDirection.multiplyScalar(-1);
        break;
      case "d":
        movement = sideDirection.multiplyScalar(1);
        break;
      default:
        return;
    }

    socket.current?.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: id.current,
          position: { x: movement.x, y: movement.y, z: movement.z },
          rotation: { x: 0, y: 0, z: 0 },
        },
      })
    );
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
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  console.log("Scene: Rendering players", players);
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <LocalPlayer
        player={players.find((player) => player.id === id.current)}
      />
      <OtherPlayers
        players={players.filter((player) => player.id !== id.current)}
      />
    </>
  );
};

const OtherPlayers: React.FC<{ players: Player[] }> = ({ players }) => {
  return (
    <>
      {players.map((player) => (
        <mesh
          key={player.id}
          position={[player.position.x, player.position.y, player.position.z]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      ))}
    </>
  );
};

const LocalPlayer: React.FC<{ player: Player | undefined }> = ({ player }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef(null);

  useFrame(() => {
    if (player && cameraRef.current && controlsRef.current) {
      // Update controls target to follow player
      (controlsRef.current as any).target = new THREE.Vector3(
        player.position.x,
        player.position.y,
        player.position.z
      );

      // Update camera position
      cameraRef.current.position.sub((controlsRef.current as any).target);
      cameraRef.current.position.setLength(7); // Fixed distance from player
      cameraRef.current.position.add((controlsRef.current as any).target);

      // Update controls
      (controlsRef.current as any).update();
    }
  });

  if (!player) return null;

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        minDistance={7}
        maxDistance={7}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={0.3}
      />
      <PerspectiveCamera ref={cameraRef} fov={75} />
      <mesh
        position={[player.position.x, player.position.y, player.position.z]}
        rotation={[player.rotation.x, player.rotation.y, player.rotation.z]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </>
  );
};
