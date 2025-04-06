import { useMatcapTexture, Center, Text3D, OrbitControls } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const torusGeometry = new THREE.TorusGeometry(1, 0.6, 16, 32);
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const coneGeometry = new THREE.ConeGeometry(0.5, 1, 32);

const donutMaterial = new THREE.MeshMatcapMaterial()
const textMaterial = new THREE.MeshMatcapMaterial()

export default function Experience() {
    const shapes = useRef([])

    const [donutMatcapTexture] = useMatcapTexture('1D3FCC_051B5F_81A0F2_5579E9', 256)
    const [textMatcapTexture] = useMatcapTexture('8A5B34_F3BD7C_DA9758_BE7E45', 256)

    useFrame((state, delta) => {
        shapes.current.forEach((shape) => {
            shape.rotation.y += delta * 0.2
        })
    })

    useEffect(() => {
        donutMatcapTexture.colorSpace = THREE.SRGBColorSpace
        donutMatcapTexture.needsUpdate = true
        donutMaterial.matcap = donutMatcapTexture
        donutMaterial.needsUpdate = true

        textMatcapTexture.colorSpace = THREE.SRGBColorSpace
        textMatcapTexture.needsUpdate = true
        textMaterial.matcap = textMatcapTexture
        textMaterial.needsUpdate = true
    }, [donutMatcapTexture, textMatcapTexture])

    return <>
        <Perf position="top-left" />
        <OrbitControls makeDefault />
        <Center>
            <Text3D
                material={textMaterial}
                font="/fonts/helvetiker_regular.typeface.json"
                size={0.75}
                height={0.2}
                curveSegments={12}
                bevelEnabled
                bevelThickness={0.07}
                bevelSize={0.04}
                bevelOffset={0}
                bevelSegments={5}
            >
                Junior Dev
            </Text3D>
        </Center>
        { [...Array(100)].map((_, index) => {
            const randomGeometry = Math.random() > 0.66 ? torusGeometry : Math.random() > 0.33 ? cubeGeometry : coneGeometry;
            return (
                <mesh
                    ref={(element) => shapes.current[index] = element}
                    key={index}
                    geometry={randomGeometry}
                    material={donutMaterial}
                    position={[
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10
                    ]}
                    scale={0.2 + Math.random() * 0.2}
                    rotation={[
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI 
                    ]}
                />
            );
        })}
    </>
}
