import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Model as PufferModel } from "./assets/Puffer.tsx";
import { Model as SharkModel } from "./assets/Shark.tsx";
import { Model as SunfishModel } from "./assets/Sunfish.tsx";
import { Model as SwordfishModel } from "./assets/Swordfish.tsx";

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
}

export const Scene: React.FC = () => {
  console.log("RENDERING SCENE");
  const socket = useRef<WebSocket>();
  const id = useRef<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const playerRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();

  //global vs local rotations
  //perhaps rotate mesh instead of rigidbody
  //options: set rapier rigidbody local z rotation to 0
  //rotate mesh, which takes local rotation, instead of rigidbody which is global
  //calculate the the rapier rigidbody global z rotation that would make local z rotation 0

  const handleClick = () => {
    console.log("CLICKED");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("KEY DOWN", event);

    const quaternion = new THREE.Quaternion();
    camera.getWorldQuaternion(quaternion);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

    let movement = new THREE.Vector3();
    let rotation = new THREE.Quaternion();

    switch (event.key) {
      case "w":
        movement.add(forward);
        rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
        rotation.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            forward.negate(),
            up
          )
        );

        break;
      case "s":
        movement.sub(forward);
        rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
        rotation.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), forward, up)
        );

        break;
      case "a":
        movement.sub(right);
        rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
        rotation.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), right, up)
        );

        break;
      case "d":
        movement.add(right);
        rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
        rotation.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            right.negate(),
            up
          )
        );

        break;
      default:
        return;
    }

    movement.normalize().multiplyScalar(5);

    const position = playerRef.current?.translation();

    console.log("SENDING PLAYER MOVEMENT", movement, rotation);
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
          rotation: {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
            w: rotation.w,
          },
        },
      })
    );
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    console.log("Scene: Handling key up event", event);
    const position = playerRef.current?.translation();
    const rotation = playerRef.current?.rotation();
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
          rotation: {
            x: rotation?.x,
            y: rotation?.y,
            z: rotation?.z,
            w: rotation?.w,
          },
        },
      })
    );
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    console.log("EVENT LISTENERS ADDED");
    socket.current = new WebSocket("ws://localhost:8080");
    console.log("WEBSOCKET INSTANCE CREATED");

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
        default:
          console.log("RECEIVED UNKNOWN MESSAGE TYPE", data.type);
      }
    };

    socket.current.onclose = () => {
      console.log("WEBSOCKET CONNECTION CLOSED");
    };

    return () => {
      console.log("CLEANING UP WEBSOCKET CONNECTION");
      socket.current?.close();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  console.log("RENDERING PLAYERS", players);
  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} />
      <LocalPlayer
        player={players.find((player) => player.id === id.current)}
        playerRef={playerRef}
      />
      {players
        .filter((player) => player.id !== id.current)
        .map((player) => (
          <Player key={player.id} player={player} />
        ))}

      <UnderwaterTerrain />
    </>
  );
};

const Player: React.FC<{ player: Player }> = ({ player }) => {
  const playerRef = useRef<RapierRigidBody>(null);
  useFrame((state, delta, frame) => {
    playerRef.current?.wakeUp();
    if (playerRef.current) {
      playerRef.current.setLinvel(
        {
          x: player.velocity.x,
          y: player.velocity.y,
          z: player.velocity.z,
        },
        true
      );

      const currentRotation = new THREE.Quaternion(
        playerRef.current.rotation().x,
        playerRef.current.rotation().y,
        playerRef.current.rotation().z,
        playerRef.current.rotation().w
      );

      const targetRotation = new THREE.Quaternion(
        player.rotation.x,
        player.rotation.y,
        player.rotation.z,
        player.rotation.w
      );

      targetRotation.slerp(currentRotation, 50 * delta);

      playerRef.current?.setRotation(
        {
          x: targetRotation.x,
          y: targetRotation.y,
          z: targetRotation.z,
          w: targetRotation.w,
        },
        true
      );
    }
  });

  return (
    <>
      <RigidBody
        ref={playerRef}
        key={player.id}
        lockTranslations={true}
        lockRotations={true}
      >
        <PufferModel />
      </RigidBody>
    </>
  );
};

const LocalPlayer: React.FC<{
  player: Player | undefined;
  playerRef: React.RefObject<RapierRigidBody>;
}> = ({ player, playerRef }) => {
  console.log("RENDERING LOCAL PLAYER");
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useFrame((state, delta, frame) => {
    playerRef.current?.wakeUp();
    if (player && controlsRef.current) {
      playerRef.current?.setLinvel(
        {
          x: player.velocity.x,
          y: player.velocity.y,
          z: player.velocity.z,
        },
        true
      );

      const currentRotation = new THREE.Quaternion(
        playerRef.current?.rotation().x,
        playerRef.current?.rotation().y,
        playerRef.current?.rotation().z,
        playerRef.current?.rotation().w
      );

      const targetRotation = new THREE.Quaternion(
        player.rotation.x,
        player.rotation.y,
        player.rotation.z,
        player.rotation.w
      );

      targetRotation.slerp(currentRotation, 50 * delta);

      playerRef.current?.setRotation(
        {
          x: targetRotation.x,
          y: targetRotation.y,
          z: targetRotation.z,
          w: targetRotation.w,
        },
        true
      );

      const position = playerRef.current?.translation();
      if (position) {
        controlsRef.current.target.set(position.x, position.y, position.z);
      }
    }
  });

  if (!player) return null;

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        minDistance={7}
        maxDistance={7}
        maxPolarAngle={Math.PI / 1.1}
        minPolarAngle={0.3}
        enablePan={false}
      />

      <RigidBody ref={playerRef} lockRotations={true} lockTranslations={true}>
        <PufferModel />
      </RigidBody>
    </>
  );
};

const UnderwaterTerrain: React.FC = () => {
  return (
    <group>
      {/* Ocean floor */}
      <mesh position={[0, -20, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1e4d6b" />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0077be" transparent opacity={0.7} />
      </mesh>

      {/* Walls */}
      <Wall position={[50, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Wall position={[-50, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Wall position={[0, 0, 50]} rotation={[0, Math.PI, 0]} />
      <Wall position={[0, 0, -50]} rotation={[0, 0, 0]} />

      {/* Coral reef structures */}
      <CoralReef position={[-15, -15, -15]} scale={[5, 10, 5]} />
      <CoralReef position={[10, -18, 5]} scale={[8, 6, 8]} />
      <CoralReef position={[0, -12, -20]} scale={[6, 15, 6]} />
      <CoralReef position={[25, -16, 25]} scale={[7, 8, 7]} />
      <CoralReef position={[-30, -14, 10]} scale={[5, 12, 5]} />

      {/* Underwater caves */}
      <UnderwaterCave position={[-5, -10, 10]} />
      <UnderwaterCave position={[20, -5, -30]} scale={[1.5, 1.5, 1.5]} />

      {/* Rock formations */}
      <RockFormation position={[35, -18, -15]} scale={[3, 2, 3]} />
      <RockFormation position={[-25, -15, 35]} scale={[2, 3, 2]} />
    </group>
  );
};

const Wall: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
}> = ({ position, rotation }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[100, 40]} />
      <meshStandardMaterial
        color="#0077be"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const CoralReef: React.FC<{
  position: [number, number, number];
  scale: [number, number, number];
}> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff7f50" />
      </mesh>
      <mesh position={[0.5, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#ff6347" />
      </mesh>
      <mesh position={[-0.3, 0.7, 0.3]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#ffa07a" />
      </mesh>
    </group>
  );
};

const UnderwaterCave: React.FC<{
  position: [number, number, number];
  scale?: [number, number, number];
}> = ({ position, scale = [1, 1, 1] }) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[10, 8, 10]} />
        <meshStandardMaterial color="#2f4f4f" side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -4, 5]}>
        <boxGeometry args={[8, 1, 1]} />
        <meshStandardMaterial color="#2f4f4f" />
      </mesh>
    </group>
  );
};

const RockFormation: React.FC<{
  position: [number, number, number];
  scale: [number, number, number];
}> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <dodecahedronGeometry args={[2]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      <mesh position={[1.5, -1, 1]}>
        <dodecahedronGeometry args={[1.5]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[-1, 1, -1]}>
        <dodecahedronGeometry args={[1]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
    </group>
  );
};
