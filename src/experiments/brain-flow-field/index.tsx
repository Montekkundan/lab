import { FC, Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'

import { R3FCanvasLayout, R3FCanvasLayoutProps } from '../../components/layouts/r3f-layput'
import BrainModel from './brain-flow-field'

// Custom type for components with layout and metadata
type ExperimentComponent<P = object> = FC<P> & {
  Layout?: FC<R3FCanvasLayoutProps>
  Title?: string
  Description?: string
  background?: string
  Tags?: string[]
}

const BrainFlowFieldExperiment: ExperimentComponent = () => {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={1} />
      <directionalLight intensity={2} position={[2, 4, 6]} />
      <BrainModel />
      <OrbitControls
        enableDamping
        enablePan={false}
        minDistance={1}
        maxDistance={1.3}
        minPolarAngle={Math.PI * 0.35}
        maxPolarAngle={Math.PI * 0.75}
        target={[0, 0, 0]}
      />
    </Suspense>
  )
}

BrainFlowFieldExperiment.Layout = (props) => (
  <R3FCanvasLayout {...props} camera={{ position: [0, 0, 3], fov: 45 }} />
)
BrainFlowFieldExperiment.Title = 'Brain Model'
BrainFlowFieldExperiment.Description = 'Brain point cloud render'
BrainFlowFieldExperiment.Tags = ['r3f', 'model']

export default BrainFlowFieldExperiment
