import React, { Suspense } from 'react';
import Experience from './Experience';
import { R3FCanvasLayout } from '../../components/layouts/r3f-layput';

function App() {
  return (
    <Suspense fallback={null}>
      <Experience />
    </Suspense>
  );
}

App.Layout = R3FCanvasLayout;
App.Title = 'Junior Dev';
App.Description = 'I am now a junior developer!';
App.Tags = ['r3f'];

export default App;
