/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.2 Puffer.glb --transform --types 
Files: Puffer.glb [238.58KB] > /Users/normanqian/fractalcamp/gamesHackathon2/frontend/public/Puffer-transformed.glb [58.99KB] (75%)
*/

import * as THREE from "three";
import React from "react";
import { useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { GLTF, SkeletonUtils } from "three-stdlib";

type ActionName =
  | "Fish_Armature|Attack"
  | "Fish_Armature|Death"
  | "Fish_Armature|Out_Of_Water"
  | "Fish_Armature|Swimming_Fast"
  | "Fish_Armature|Swimming_Impulse"
  | "Fish_Armature|Swimming_Normal";

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

type GLTFResult = GLTF & {
  nodes: {
    Pufferfish002_1: THREE.SkinnedMesh;
    Pufferfish002_2: THREE.SkinnedMesh;
    Pufferfish_1: THREE.SkinnedMesh;
    Pufferfish_2: THREE.SkinnedMesh;
    Pufferfish_3: THREE.SkinnedMesh;
    Pufferfish_4: THREE.SkinnedMesh;
    Main1: THREE.Bone;
  };
  materials: {
    Pufferfish_Main: THREE.MeshStandardMaterial;
    Pufferfish_Light: THREE.MeshStandardMaterial;
    Puffefish_Black: THREE.MeshStandardMaterial;
    Eyes: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

export function Model(props: JSX.IntrinsicElements["group"]) {
  const group = React.useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/Puffer-transformed.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as GLTFResult;
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Root_Scene">
        <group name="Fish_Armature" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <primitive object={nodes.Main1} />
        </group>
        <group name="Pufferfish002" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <skinnedMesh
            name="Pufferfish002_1"
            geometry={nodes.Pufferfish002_1.geometry}
            material={materials.Pufferfish_Main}
            skeleton={nodes.Pufferfish002_1.skeleton}
          />
          <skinnedMesh
            name="Pufferfish002_2"
            geometry={nodes.Pufferfish002_2.geometry}
            material={materials.Pufferfish_Light}
            skeleton={nodes.Pufferfish002_2.skeleton}
          />
        </group>
        <group name="Pufferfish" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <skinnedMesh
            name="Pufferfish_1"
            geometry={nodes.Pufferfish_1.geometry}
            material={materials.Pufferfish_Main}
            skeleton={nodes.Pufferfish_1.skeleton}
          />
          <skinnedMesh
            name="Pufferfish_2"
            geometry={nodes.Pufferfish_2.geometry}
            material={materials.Pufferfish_Light}
            skeleton={nodes.Pufferfish_2.skeleton}
          />
          <skinnedMesh
            name="Pufferfish_3"
            geometry={nodes.Pufferfish_3.geometry}
            material={materials.Puffefish_Black}
            skeleton={nodes.Pufferfish_3.skeleton}
          />
          <skinnedMesh
            name="Pufferfish_4"
            geometry={nodes.Pufferfish_4.geometry}
            material={materials.Eyes}
            skeleton={nodes.Pufferfish_4.skeleton}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/Puffer-transformed.glb");
