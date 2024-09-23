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
}> = ({ player }) => {
  console.log("RENDERING LOCAL PLAYER", player);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  if (!player) {
    return null;
  }

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

  controlsRef.current?.target.set(
    player.position.x,
    player.position.y,
    player.position.z
  );

  console.log("RENDERING LOCAL PLAYER", player.chatBubble);

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

      <SwordfishModel
        position={position}
        quaternion={quaternion}
        isLocal={true}
        player={player}
        scale={0.5}
      ></SwordfishModel>
      <ChatBubble player={player} />
    </>
  );
};
