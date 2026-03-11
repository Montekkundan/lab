import { Center, useGLTF } from '@react-three/drei'
import type { JSX } from 'react'
import type { BufferGeometry, Material } from 'three'

type BrainNodes = Record<string, { geometry: BufferGeometry }>
type BrainMaterials = Record<string, Material>

export default function BrainModel(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/brain.v2.glb')
  const brainNodes = nodes as unknown as BrainNodes
  const brainMaterials = materials as unknown as BrainMaterials

  return (
    <group {...props} dispose={null}>
      <Center>
        <group rotation={[-Math.PI, 0, 0]} scale={0.002}>
          <points geometry={brainNodes.Object_2.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_3.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_4.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_5.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_6.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_7.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_8.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_9.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_10.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_11.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_12.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_13.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_14.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_15.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_16.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_17.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_18.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_19.geometry} material={brainMaterials['Scene_-_Root']} />
          <points geometry={brainNodes.Object_20.geometry} material={brainMaterials['Scene_-_Root']} />
        </group>
      </Center>
    </group>
  )
}

useGLTF.preload('/models/brain.v2.glb')
