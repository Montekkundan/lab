import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { FC, useRef } from 'react'

import { R3FCanvasLayout } from '../components/layouts/r3f-layput'

const Cube: FC = () => {
  const boxRef = useRef(null)

  useFrame(() => {
    if (boxRef.current) {
      boxRef.current.rotation.x += 0.01
      boxRef.current.rotation.y += 0.01
    }
  })

  return (
    <Box ref={boxRef}>
      <meshNormalMaterial />
    </Box>
  )
}

Cube.Layout = R3FCanvasLayout
Cube.Title = 'Three.js Cube'
Cube.Description =
  'This is just a cube'
Cube.background = 'dots'

export default Cube
