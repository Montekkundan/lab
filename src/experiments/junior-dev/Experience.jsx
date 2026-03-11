import { useMatcapTexture, Center, Text3D, OrbitControls } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const torusGeometry = new THREE.TorusGeometry(1, 0.6, 16, 32);
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const coneGeometry = new THREE.ConeGeometry(0.5, 1, 32);

const shapeVariants = Array.from({ length: 100 }, (_, index) => {
    const seededValue = Math.sin((index + 1) * 12.9898) * 43758.5453;
    const normalized = seededValue - Math.floor(seededValue);
    const geometrySelector = normalized < 0.33 ? 'torus' : normalized < 0.66 ? 'cube' : 'cone';

    return {
        geometrySelector,
        position: [
            (Math.sin((index + 11) * 1.1) * 0.5) * 10,
            (Math.sin((index + 17) * 1.7) * 0.5) * 10,
            (Math.sin((index + 23) * 2.3) * 0.5) * 10
        ],
        scale: 0.2 + ((Math.sin((index + 31) * 3.1) + 1) / 2) * 0.2,
        rotation: [
            ((Math.sin((index + 41) * 2.7) + 1) / 2) * Math.PI,
            ((Math.sin((index + 47) * 3.7) + 1) / 2) * Math.PI,
            ((Math.sin((index + 53) * 4.7) + 1) / 2) * Math.PI
        ]
    };
});

export default function Experience() {
    const shapes = useRef([])

    const [donutMatcapTexture] = useMatcapTexture('1D3FCC_051B5F_81A0F2_5579E9', 256)
    const [textMatcapTexture] = useMatcapTexture('8A5B34_F3BD7C_DA9758_BE7E45', 256)
    const donutMaterial = useMemo(() => {
        const material = new THREE.MeshMatcapMaterial();
        const matcap = donutMatcapTexture.clone();
        matcap.colorSpace = THREE.SRGBColorSpace;
        matcap.needsUpdate = true;
        material.matcap = matcap;
        material.needsUpdate = true;
        return material;
    }, [donutMatcapTexture])
    const textMaterial = useMemo(() => {
        const material = new THREE.MeshMatcapMaterial();
        const matcap = textMatcapTexture.clone();
        matcap.colorSpace = THREE.SRGBColorSpace;
        matcap.needsUpdate = true;
        material.matcap = matcap;
        material.needsUpdate = true;
        return material;
    }, [textMatcapTexture])

    useFrame((state, delta) => {
        shapes.current.forEach((shape) => {
            if (shape) {
                shape.rotation.y += delta * 0.2
            }
        })
    })

    return <>
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
        {shapeVariants.map((variant, index) => {
            const geometry = variant.geometrySelector === 'torus'
                ? torusGeometry
                : variant.geometrySelector === 'cube'
                    ? cubeGeometry
                    : coneGeometry;
            return (
                <mesh
                    ref={(element) => shapes.current[index] = element}
                    key={index}
                    geometry={geometry}
                    material={donutMaterial}
                    position={variant.position}
                    scale={variant.scale}
                    rotation={variant.rotation}
                />
            );
        })}
    </>
}
