import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RapierRigidBody } from "@react-three/rapier";
import { Player } from "./Player.tsx";
import { LocalPlayer } from "./LocalPlayer.tsx";
import { Terrain } from "./Terrain.tsx";

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

export const Scene: React.FC<{
  socket: WebSocket;
  playerId: string;
  players: Player[];
}> = ({ socket, playerId, players }) => {
  console.log("RENDERING SCENE");
  const playerRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState<string>(""); //onMouseEnter and onMouseLeave
  const [keyboardSettings, setKeyboardSettings] = useState<string>("");

  //Sends an action from the player to the server
  const sendAction = (action: string) => {
    socket.send(
      JSON.stringify({
        type: "action",
        payload: {
          playerId: playerId,
          action: action,
        },
      })
    );
  };

  //Sends a movement from the player to the server
  const sendMovement = (
    movement: THREE.Vector3,
    position: THREE.Vector3,
    rotation: THREE.Quaternion
  ) => {
    console.log("SENDING PLAYER MOVEMENT", movement, position, rotation);
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

  //Determines what to do when the user clicks
  const handleClick = (event: MouseEvent) => {
    console.log("CLICK", event);
    switch (hovered) {
      case "NPC":
        break;
      case "ChatBox":
        break;
      default:
        sendAction("attack");
        break;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("KEY DOWN", event);
    switch (keyboardSettings) {
      default:
        const quaternion = new THREE.Quaternion();
        camera.getWorldQuaternion(quaternion);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

        //converts Rapier Vector3 to THREE.Vector3
        const position = playerRef.current?.translation() as THREE.Vector3;
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
            movement.normalize().multiplyScalar(10);
            sendMovement(movement, position, rotation);
            break;
          case "s":
            movement.sub(forward);
            rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
            rotation.setFromRotationMatrix(
              new THREE.Matrix4().lookAt(
                new THREE.Vector3(0, 0, 0),
                forward,
                up
              )
            );
            movement.normalize().multiplyScalar(10);
            sendMovement(movement, position, rotation);
            break;
          case "a":
            movement.sub(right);
            rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
            rotation.setFromRotationMatrix(
              new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), right, up)
            );
            movement.normalize().multiplyScalar(10);
            sendMovement(movement, position, rotation);
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
            movement.normalize().multiplyScalar(10);
            sendMovement(movement, position, rotation);
            break;
          default:
            return;
        }
        break;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    console.log("KEY UP", event);
    switch (keyboardSettings) {
      default:
        const position = playerRef.current?.translation() as THREE.Vector3;
        const rotation = playerRef.current?.rotation() as THREE.Quaternion;
        sendMovement(new THREE.Vector3(0, 0, 0), position, rotation);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleClick);

    return () => {
      console.log("CLEANING UP WEBSOCKET CONNECTION");
      socket.close();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleClick);
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
      <Terrain />
    </>
  );
};
