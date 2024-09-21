import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Model as SwordfishModel } from "./assets/Swordfish.tsx";
import { ChatBubble } from "./ChatBubble";
import { OrbitControls } from "@react-three/drei";

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

export const LocalPlayer: React.FC<{
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
        <SwordfishModel isLocal={true} player={player} scale={0.5} />
        <ChatBubble message={player.chatBubble} />
      </RigidBody>
    </>
  );
};
