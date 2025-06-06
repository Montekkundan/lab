import React, { Suspense } from 'react';
import Model from './components/scene/model';
import { R3FCanvasLayout } from '../../components/layouts/r3f-layput';
import { Environment } from '@react-three/drei'

function App() {
  return (
    <Suspense fallback={null}>
      <Model />
      <directionalLight intensity={2} position={[0, 2, 3]}/>
        <Environment preset="city" />
    </Suspense>
  );
}

App.Layout = R3FCanvasLayout;
App.Title = 'Chai';
App.Description = 'Chai';
App.Tags = ['r3f'];

export default App;
