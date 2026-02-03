import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { FC, useRef } from 'react'
import { Mesh } from 'three'

import { R3FCanvasLayout, R3FCanvasLayoutProps } from '../components/layouts/r3f-layput'

// Custom type for components with layout and metadata
type ExperimentComponent<P = object> = FC<P> & {
  Layout?: FC<R3FCanvasLayoutProps>;
  Title?: string;
  Description?: React.ReactNode;
  background?: string;
  Tags?: string[];
}

const Cube: ExperimentComponent = () => {
  const boxRef = useRef<Mesh>(null)

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
Cube.Tags = ['r3f'];

export default Cube
