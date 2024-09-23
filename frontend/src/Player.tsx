import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Model as SwordfishModel } from "./assets/Swordfish.tsx";
import { ChatBubble } from "./ChatBubble.tsx";

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
    w: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  currentAction: string;
  chatBubble: string;
}

export const Player: React.FC<{ player: Player }> = ({ player }) => {
  const position = new THREE.Vector3(
    player.position.x,
    player.position.y,
    player.position.z
  );
  const quaternion = new THREE.Quaternion(
    player.rotation.x,
    player.rotation.y,
    player.rotation.z,
    player.rotation.w
  );

  console.log([player.id, player.chatBubble]);

  return (
    <>
      <SwordfishModel
        position={position}
        quaternion={quaternion}
        isLocal={false}
        player={player}
        scale={0.5}
      ></SwordfishModel>
      <ChatBubble player={player} />
    </>
  );
};
