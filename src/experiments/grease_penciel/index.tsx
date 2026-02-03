import React, { Suspense } from 'react';
import Experience from './Experience';
import { R3FCanvasLayout } from '../../components/layouts/r3f-layput';

const TempLight = () => {
    return (
      <>
        <pointLight intensity={0.5} position={[0, 0, 5]} />
        <pointLight intensity={0.5} position={[0, 0, -5]} />
        <ambientLight intensity={0.2} />
      </>
    );
  };

function App() {
  return (
    <Suspense fallback={null}>
                <TempLight />
      <Experience />
    </Suspense>
  );
}

App.Layout = R3FCanvasLayout;
App.Title = 'Grease Pencil';
App.Description = 'Testing grease pencil in three.js';
App.Tags = ['r3f'];
App.bg = 'white';
export default App;
