import { useEffect, useRef, useState } from "react";
import { OrbitControls, MeshPortalMaterial, Text } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Model as PufferModel } from "./assets/Puffer.tsx";
import { Model as SharkModel } from "./assets/Shark.tsx";
import { Model as SunfishModel } from "./assets/Sunfish.tsx";
import { Model as SwordfishModel } from "./assets/Swordfish.tsx";
import { Model as CityScene0 } from "./assets/CityScene0.tsx";

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

export const Scene: React.FC<{
  socket: WebSocket;
  playerId: string;
  players: Player[];
}> = ({ socket, playerId, players }) => {
  console.log("RENDERING SCENE");
  const playerRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();

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
    socket.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: playerId,
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
    socket.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: playerId,
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

    return () => {
      console.log("CLEANING UP WEBSOCKET CONNECTION");
      socket.close();
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
        player={players.find((player) => player.id === playerId)}
        playerRef={playerRef}
      />
      {players
        .filter((player) => player.id !== playerId)
        .map((player) => (
          <Player key={player.id} player={player} />
        ))}
      <CityScene0 scale={2} position={[-10, -10, -40]} />
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#b69f66" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[20, 15, -49]}>
        <circleGeometry args={[7, 20]}></circleGeometry>
        <MeshPortalMaterial />
      </mesh>
      <RigidBody colliders="trimesh" type="fixed" position={[0, 20, 0]}>
        <mesh>
          <boxGeometry args={[100, 50, 100]}></boxGeometry>
          <meshStandardMaterial
            color="#b69f66"
            transparent={true}
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>
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
        <ChatBubble message={player.lastChatMessage?.message} />
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

      <RigidBody ref={playerRef} lockRotations={true} colliders="ball">
        <SwordfishModel scale={0.5} />
        <ChatBubble message={player.lastChatMessage?.message} />
      </RigidBody>
    </>
  );
};

const ChatBubble: React.FC<{ message: string | undefined }> = ({ message }) => {
  if (!message) return null;

  const [bubbleSize, setBubbleSize] = useState({ width: 2.2, height: 1.2 });

  useEffect(() => {
    // Calculate the size based on the message length
    const minWidth = 2.2;
    const minHeight = 1.2;
    const charsPerLine = 10;
    const linesPerUnit = 2;

    const lines = Math.ceil(message.length / charsPerLine);
    const width = Math.max(minWidth, message.length * 0.2);
    const height = Math.max(minHeight, lines / linesPerUnit);

    setBubbleSize({ width, height });
  }, [message]);

  return (
    <group position={[0, 2, 0]}>
      {/* Front text */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.5}
        maxWidth={bubbleSize.width - 0.4}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="black"
      >
        {message}
        <meshStandardMaterial color="black" side={THREE.DoubleSide} />
      </Text>

      {/* Back text (rotated 180 degrees) */}
      <Text
        position={[0, 0, -0.02]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.5}
        maxWidth={bubbleSize.width - 0.4}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="black"
      >
        {message}
        <meshStandardMaterial color="black" side={THREE.DoubleSide} />
      </Text>
      <RoundedRectangle
        width={bubbleSize.width}
        height={bubbleSize.height}
        radius={0.2}
        depth={0.01}
      />
    </group>
  );
};

const RoundedRectangle: React.FC<{
  width: number;
  height: number;
  radius: number;
  depth: number;
}> = ({ width, height, radius, depth }) => {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.2,
    bevelSize: radius * 0.5,
    bevelSegments: 16,
  };

  return (
    <mesh>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="white" side={THREE.DoubleSide} />
    </mesh>
  );
};
