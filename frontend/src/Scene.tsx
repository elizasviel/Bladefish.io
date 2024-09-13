import { useEffect, useRef, useState } from "react";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
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
  };
}

//The state of the scene is determined by the server and sent to the client via websockets.
//Local player sends their locally calculated position to the server, server sends the same position back to the local player, but also to all other clients.
//The position of the local player should be reported to the server not not be set by it
export const Scene: React.FC = () => {
  console.log("Scene: Component rendering");
  const socket = useRef<WebSocket>();
  const id = useRef<string>(""); // This ref is used to store the ID of the local player
  const [players, setPlayers] = useState<Player[]>([]); // State to store all players
  const playerRef = useRef<RapierRigidBody>(null); // This ref is used to access the position of the player
  const { camera } = useThree();
  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("Scene: Handling key down event", event);
    if (!camera) return;

    const direction = new THREE.Vector3();
    const sideDirection = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get the direction the camera is facing
    direction.y = 0; // Keep movement on the horizontal plane
    direction.normalize();
    sideDirection.copy(direction).cross(camera.up).normalize();

    let movement: THREE.Vector3;
    let rotation: number;

    switch (event.key) {
      case "w":
        movement = direction.multiplyScalar(1);
        rotation = Math.atan2(direction.x, direction.z);
        break;
      case "s":
        movement = direction.multiplyScalar(-1);
        rotation = Math.atan2(direction.x, direction.z);
        break;
      case "a":
        movement = sideDirection.multiplyScalar(-1);
        rotation = Math.atan2(sideDirection.x, sideDirection.z);
        break;
      case "d":
        movement = sideDirection.multiplyScalar(1);
        rotation = Math.atan2(sideDirection.x, sideDirection.z);
        break;
      default:
        return;
    }
    // Ensure rotation is within [0, 2π]
    rotation = (rotation + 2 * Math.PI) % (2 * Math.PI);

    // Obtain the current position of the player so we can send it to the server
    const position = playerRef.current?.translation();

    socket.current?.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: id.current,
          velocity: { x: movement.x, y: movement.y, z: movement.z },
          // TODO: Fix this so that the player's position is updated correctly.
          position: {
            x: position?.x,
            y: position?.y,
            z: position?.z,
          },
          rotation: { x: 0, y: rotation, z: 0 },
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
        playerRef={playerRef}
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

const LocalPlayer: React.FC<{
  player: Player | undefined;
  playerRef: React.RefObject<RapierRigidBody>;
}> = ({ player, playerRef }) => {
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
      <RigidBody
        ref={playerRef}
        linearVelocity={[
          player.velocity.x,
          player.velocity.y,
          player.velocity.z,
        ]}
        rotation={[player.rotation.x, player.rotation.y, player.rotation.z]}
      >
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial attach="material-0" color="red" />
          <meshStandardMaterial attach="material-1" color="green" />
          <meshStandardMaterial attach="material-2" color="blue" />
          <meshStandardMaterial attach="material-3" color="yellow" />
          <meshStandardMaterial attach="material-4" color="purple" />
          <meshStandardMaterial attach="material-5" color="cyan" />
        </mesh>
      </RigidBody>
    </>
  );
};
