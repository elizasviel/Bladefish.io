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
  const [players, setPlayers] = useState<Player[]>([]); // State to store all players //perhaps useref?
  const playerRef = useRef<RapierRigidBody>(null); // This ref is used to access the position of the player
  const { camera } = useThree();
  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("Scene: Handling key down event", event);
    if (!camera) return;

    const quaternion = new THREE.Quaternion();
    camera.getWorldQuaternion(quaternion);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);

    let movement = new THREE.Vector3();
    let rotation = new THREE.Euler();

    switch (event.key) {
      case "w":
        movement.add(forward);
        rotation.setFromQuaternion(quaternion);
        break;
      case "s":
        movement.sub(forward);
        rotation.setFromQuaternion(quaternion).y += Math.PI;
        break;
      case "a":
        movement.sub(right);
        rotation.setFromQuaternion(quaternion).y += Math.PI / 2;
        break;
      case "d":
        movement.add(right);
        rotation.setFromQuaternion(quaternion).y -= Math.PI / 2;
        break;
      default:
        return;
    }

    movement.y = 0; // Ensure movement is only horizontal
    movement.normalize().multiplyScalar(5); // Adjust speed as needed

    // Obtain the current position of the player so we can send it to the server
    const position = playerRef.current?.translation();

    socket.current?.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: id.current,
          velocity: { x: movement.x, y: movement.y, z: movement.z },
          position: {
            x: position?.x,
            y: position?.y,
            z: position?.z,
          },
          rotation: { x: 0, y: rotation.y, z: 0 },
        },
      })
    );
  };
  const handleKeyUp = (event: KeyboardEvent) => {
    console.log("Scene: Handling key up event", event);
    const position = playerRef.current?.translation();
    //const rotation = playerRef.current?.rotation();
    socket.current?.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: id.current,
          velocity: { x: 0, y: 0, z: 0 },
          position: {
            x: position?.x,
            y: position?.y,
            z: position?.z,
          },
          //rotation: { x: rotation?.x, y: rotation?.y, z: rotation?.z },
        },
      })
    );
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

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
      window.removeEventListener("keyup", handleKeyUp);
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
      <mesh position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="grey" side={THREE.DoubleSide} />
      </mesh>
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
  console.log("RENDERING LOCAL PLAYER");
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef(null);

  useFrame(() => {
    if (player && cameraRef.current && controlsRef.current) {
      playerRef.current?.setLinvel(
        {
          x: player.velocity.x,
          y: player.velocity.y,
          z: player.velocity.z,
        },
        true
      );

      playerRef.current?.setRotation(
        {
          x: player.rotation.x,
          y: player.rotation.y,
          z: player.rotation.z,
          w: 1,
        },
        true
      );

      // Update controls target to follow player
      const position = playerRef.current?.translation();
      (controlsRef.current as any).target = new THREE.Vector3(
        position?.x,
        position?.y,
        position?.z
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
        maxDistance={10}
        maxPolarAngle={Math.PI / 1.1}
        minPolarAngle={0.3}
      />
      <PerspectiveCamera ref={cameraRef} fov={75} />
      <RigidBody ref={playerRef}>
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
