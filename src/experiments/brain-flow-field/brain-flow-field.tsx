import { Center, useGLTF } from '@react-three/drei'

export default function BrainModel(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/brain.glb')

  return (
    <group {...props} dispose={null}>
      <Center>
        <group rotation={[-Math.PI, 0, 0]} scale={0.002}>
          <points geometry={(nodes as any).Object_2.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_3.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_4.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_5.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_6.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_7.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_8.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_9.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_10.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_11.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_12.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_13.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_14.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_15.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_16.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_17.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_18.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_19.geometry} material={(materials as any)['Scene_-_Root']} />
          <points geometry={(nodes as any).Object_20.geometry} material={(materials as any)['Scene_-_Root']} />
        </group>
      </Center>
    </group>
  )
}

useGLTF.preload('/models/brain.glb')
