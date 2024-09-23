import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Player } from "./Player.tsx";
import { LocalPlayer } from "./LocalPlayer.tsx";
import { Terrain } from "./Terrain.tsx";
import { Enemy } from "./Enemy.tsx";
interface Player {
  id: number;
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

interface Enemy {
  id: number;
  position: {
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
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  health: number;
  currentAction: string;
}

export const Scene: React.FC<{
  socket: WebSocket;
  playerId: number;
  players: Player[];
  enemies: Enemy[];
}> = ({ socket, playerId, players, enemies }) => {
  console.log("RENDERING SCENE");
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
  const sendMovement = (input: string) => {
    console.log("SENDING PLAYER MOVEMENT", input);
    const quaternion = new THREE.Quaternion();
    camera.getWorldQuaternion(quaternion);

    socket.send(
      JSON.stringify({
        type: "playerMovement",
        payload: {
          id: playerId,
          action: input,
          cameraRotation: quaternion,
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
        sendMovement(event.key);
        break;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    console.log("KEY UP", event);
    switch (keyboardSettings) {
      default:
        sendMovement("stop");
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
      <LocalPlayer player={players.find((player) => player.id === playerId)} />
      {players
        .filter((player) => player.id !== playerId)
        .map((player) => (
          <Player key={player.id} player={player} />
        ))}
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
      <Terrain />
    </>
  );
};
