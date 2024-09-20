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
import { Model as CityScene0 } from "./assets/CityScene0.tsx";

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

    movement.normalize().multiplyScalar(10);

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
      <CityScene0 scale={2} position={[-10, -10, -40]} />
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#b69f66" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

const Player: React.FC<{ player: Player }> = ({ player }) => {
  const playerRef = useRef<RapierRigidBody>(null);
  //The first time a foreign player is rendered, we need to teleport them to their position
  useEffect(() => {
    playerRef.current?.wakeUp();
    playerRef.current?.setTranslation(
      {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
      },
      true
    );
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
        w: player.rotation.w,
      },
      true
    );
  }, []);
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

      //targetRotation.slerp(currentRotation, 50 * delta);

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
        <SwordfishModel />
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

      //targetRotation.slerp(currentRotation, 50 * delta);

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
        <SharkModel scale={0.5} />
      </RigidBody>
    </>
  );
};
