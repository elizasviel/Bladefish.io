import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import {
  useKeyboardControls,
  PerspectiveCamera,
  OrbitControls,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import * as THREE from "three";

const SPEED = 5;
const SPRINT_SPEED = 20;
const SPRINT_DURATION = 0.5; // in seconds
const SPRINT_COOLDOWN = 1; // in seconds

export function Player({
  position,
  isLocal,
  onPositionUpdate,
}: {
  position: { x: number; y: number; z: number };
  isLocal: boolean;
  onPositionUpdate?: (position: { x: number; y: number; z: number }) => void;
}) {
  const playerRef = useRef<RapierRigidBody>(null);
  const cameraRef = useRef(null);
  const [playerRotation] = useState(new THREE.Quaternion());
  const [sprinting, setSprinting] = useState(false);
  const [canSprint, setCanSprint] = useState(true);
  const sprintDirectionRef = useRef(new THREE.Vector3());

  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { camera } = useThree();

  useEffect(() => {
    if (!isLocal) return;

    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (pressed) => {
        if (pressed && canSprint) {
          startSprint();
        }
      }
    );

    return () => {
      unsubscribeJump();
    };
  }, [canSprint, subscribeKeys, isLocal]);

  const startSprint = () => {
    if (canSprint) {
      setSprinting(true);
      setCanSprint(false);
      const { forward, backward, left, right, up, down } = getKeys();
      sprintDirectionRef.current.copy(
        calculateMovement(camera, forward, backward, left, right, up, down)
      );
      setTimeout(() => {
        setSprinting(false);
        setTimeout(() => setCanSprint(true), SPRINT_COOLDOWN * 1000);
      }, SPRINT_DURATION * 1000);
    }
  };

  useFrame((_, delta) => {
    if (!playerRef.current || !isLocal) return;

    const { forward, backward, left, right, up, down } = getKeys();
    const movement = calculateMovement(
      camera,
      forward,
      backward,
      left,
      right,
      up,
      down
    );

    let newVelocity;
    if (sprinting) {
      newVelocity = calculateNewVelocity(
        sprintDirectionRef.current,
        SPRINT_SPEED
      );
    } else {
      newVelocity = calculateNewVelocity(movement);
    }

    playerRef.current.setLinvel(newVelocity, true);

    if (movement.length() > 0) {
      updatePlayerRotation(movement, playerRotation, delta);
      playerRef.current.setRotation(playerRotation, true);
    }

    updateCameraPosition(playerRef.current, cameraRef.current);
    const position = playerRef.current.translation();
    onPositionUpdate?.({ x: position.x, y: position.y, z: position.z });
  });

  return (
    <>
      {isLocal && (
        <>
          <PerspectiveCamera fov={75} />
          <OrbitControls ref={cameraRef} minDistance={7} maxDistance={7} />
        </>
      )}
      <PlayerMesh ref={playerRef} position={position} />
    </>
  );
}

function calculateMovement(
  camera: THREE.Camera,
  forward: boolean,
  backward: boolean,
  left: boolean,
  right: boolean,
  up: boolean,
  down: boolean
) {
  const cameraDirection = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .normalize();
  const cameraRight = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(camera.quaternion)
    .normalize();
  const cameraUp = new THREE.Vector3(0, 1, 0);

  const movement = new THREE.Vector3();
  if (forward) movement.add(cameraDirection);
  if (backward) movement.sub(cameraDirection);
  if (left) movement.sub(cameraRight);
  if (right) movement.add(cameraRight);
  if (up) movement.add(cameraUp);
  if (down) movement.sub(cameraUp);

  return movement.normalize();
}

function calculateNewVelocity(movement: THREE.Vector3, speed: number = SPEED) {
  return {
    x: movement.x * speed,
    y: movement.y * speed,
    z: movement.z * speed,
  };
}

function updatePlayerRotation(
  movement: THREE.Vector3,
  currentRotation: THREE.Quaternion,
  delta: number
) {
  const horizontalMovement = new THREE.Vector3(
    movement.x,
    0,
    movement.z
  ).normalize();
  const targetRotationHorizontal = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    horizontalMovement
  );

  const verticalAngle = Math.atan2(
    movement.y,
    Math.sqrt(movement.x * movement.x + movement.z * movement.z)
  );
  const targetRotationVertical = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -verticalAngle
  );

  const targetRotation = new THREE.Quaternion().multiplyQuaternions(
    targetRotationHorizontal,
    targetRotationVertical
  );

  currentRotation.slerp(targetRotation, 10 * delta);
}

function updateCameraPosition(player: RapierRigidBody, camera: any) {
  if (camera) {
    const position = player.translation();
    camera.target.set(position.x, position.y, position.z);
    camera.update();
  }
}

const PlayerMesh = React.forwardRef<
  RapierRigidBody,
  { position: { x: number; y: number; z: number } }
>(({ position }, ref) => {
  const { scene, animations } = useGLTF(
    "/Animated Fish Bundle-glb/Fish.glb"
  ) as any;
  const { actions } = useAnimations(animations, scene);

  React.useEffect(() => {
    const swim = actions["Armature|Swim.001"];
    if (swim) {
      swim.play();
    }
  }, [actions]);

  return (
    <RigidBody
      colliders="hull"
      restitution={0}
      ccd={true}
      ref={ref}
      lockRotations={false}
      name="player"
      position={[position.x, position.y, position.z]}
    >
      <group scale={[0.5, 0.5, 0.5]}>
        <primitive object={scene} />
      </group>
    </RigidBody>
  );
});

PlayerMesh.displayName = "PlayerMesh";

useGLTF.preload("/Animated Fish Bundle-glb/Fish.glb");
