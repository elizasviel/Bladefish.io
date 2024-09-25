/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.2 Shark.glb --transform --types 
Files: Shark.glb [527.84KB] > /Users/normanqian/fractalcamp/gamesHackathon2/frontend/public/Shark-transformed.glb [73.02KB] (86%)
*/

import * as THREE from 'three'
import React from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { GLTF, SkeletonUtils } from 'three-stdlib'

type ActionName = 'SharkArmature|SharkArmature|SharkArmature|Swim_Bite|SharkArmature|Swim_Bite' | 'SharkArmature|SharkArmature|SharkArmature|Swim_Fast|SharkArmature|Swim_Fast' | 'SharkArmature|SharkArmature|SharkArmature|Swim|SharkArmature|Swim'

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName
}

type GLTFResult = GLTF & {
  nodes: {
    Shark: THREE.SkinnedMesh
    Shark001: THREE.SkinnedMesh
    Abdomen: THREE.Bone
    Center: THREE.Bone
    Root: THREE.Bone
  }
  materials: {
    AtlasMaterial: THREE.MeshStandardMaterial
  }
  animations: GLTFAction[]
}

export function Model(props: JSX.IntrinsicElements['group']) {
  const group = React.useRef<THREE.Group>()
  const { scene, animations } = useGLTF('/Shark-transformed.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone) as GLTFResult
  const { actions } = useAnimations(animations, group)
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Root_Scene">
        <group name="SharkArmature" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <primitive object={nodes.Abdomen} />
          <primitive object={nodes.Center} />
        </group>
        <primitive object={nodes.Root} />
        <skinnedMesh name="Shark" geometry={nodes.Shark.geometry} material={materials.AtlasMaterial} skeleton={nodes.Shark.skeleton} rotation={[-Math.PI / 2, 0, 0]} scale={100} />
        <skinnedMesh name="Shark001" geometry={nodes.Shark001.geometry} material={materials.AtlasMaterial} skeleton={nodes.Shark001.skeleton} rotation={[-Math.PI / 2, 0, 0]} scale={100} />
      </group>
    </group>
  )
}

useGLTF.preload('/Shark-transformed.glb')
