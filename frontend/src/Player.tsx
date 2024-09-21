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
        <SwordfishModel isLocal={false} player={player} scale={0.5} />
        <ChatBubble message={player.chatBubble} />
      </RigidBody>
    </>
  );
};
