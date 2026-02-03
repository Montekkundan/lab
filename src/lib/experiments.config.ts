export type ExperimentConfig = {
  order: number;
  slug: string;
  file: string;
  title?: string;
  description?: string;
  tags?: string[];
  background?: 'white' | 'dots' | 'dots_white' | 'none';
  og?: string;
};

export const experimentsConfig: ExperimentConfig[] = [
  {
    order: 1,
    slug: 'multilanguage',
    file: 'multilanguage/index.tsx',
    title: 'Multi Language Translation',
    description: 'AI-powered multi-language translation tool',
    tags: ['ai', 'translation', 'ui'],
    background: 'dots'
  },
  {
    order: 2,
    slug: 'ascii-cube',
    file: 'ascii-cube/index.tsx',
    title: 'ASCII Cube',
    description: 'ASCII Cube',
    tags: ['ui', '3d'],
    background: 'dots'
  },
  {
    order: 3,
    slug: 'shared-layout',
    file: 'shared-layout/index.js',
    title: 'Shared layout',
    tags: ['framer motion', 'animation'],
    background: 'dots'
  },
    {
    order: 4,
    slug: 'bashub-button',
    file: 'bashub-button/index.tsx',
    title: 'Bashub Button',
    description: 'Built with Bashub Button',
    tags: ['ui'],
    background: 'dots',
    og: '/ogs/basehub-button.png'
  },
  {
    order: 5,
    slug: 'ascii-knot',
    file: 'ascii-knot/index.tsx',
    title: 'ASCII Knot',
    description: 'ASCII Knot',
    tags: ['ui', '3d'],
    background: 'dots'
  },
  {
    order: 6,
    slug: 'shadcn-test',
    file: 'shadcn-test/index.tsx',
    title: 'Shadcn Test',
    description: 'Testing Shadcn UI components',
    tags: ['ui', 'shadcn'],
    background: 'dots'
  },
  {
    order: 7,
    slug: 'chai',
    file: 'Chai/index.jsx',
    title: 'Chai',
    description: 'Chai',
    tags: ['r3f']
  },
    {
    order: 8,
    slug: 'ascii-pyramid',
    file: 'ascii-pyramid/index.tsx',
    title: 'ASCII Pyramid',
    description: 'ASCII Pyramid',
    tags: ['ui', '3d'],
    background: 'dots'
  },
  {
    order: 9,
    slug: 'junior-dev',
    file: 'junior-dev/index.jsx',
    title: 'Junior Dev',
    description: 'I am now a junior developer!',
    tags: ['r3f']
  },
  {
    order: 10,
    slug: 'grease-pencil',
    file: 'grease_penciel/index.tsx',
    title: 'Grease Pencil',
    description: 'Testing grease pencil in three.js',
    tags: ['r3f']
  },
  {
    order: 11,
    slug: 'cube',
    file: 'cube.tsx',
    title: 'Three.js Cube',
    description: 'This is just a cube',
    tags: ['r3f']
  },
  {
    order: 12,
    slug: 'barnes-hut',
    file: 'barnes-hut/index.tsx',
    title: 'Barnes-Hut N-Body Simulation',
    tags: ['simulation', 'physics', 'canvas', 'algorithm'],
    background: 'none'
  },
  {
    order: 13,
    slug: 'vit-mnist-token-grid',
    file: 'vit-mnist-token-grid/index.tsx',
    title: 'ViT Token Grid',
    description: 'Minimal MNIST ViT demo with patch token visualization.',
    tags: ['ai', 'ui', 'canvas']
  },
  // {
  //   order: 14,
  //   slug: 'lstm-ghost-text',
  //   file: 'lstm-ghost-text/index.tsx',
  //   title: 'LSTM Ghost Text',
  //   description: 'Minimal compose card with ghost-text suggestions.',
  //   tags: ['ui', 'motion', 'typography']
  // },
  // {
  //   order: 15,
  //   slug: 'brain-flow-field',
  //   file: 'brain-flow-field/index.tsx',
  //   title: 'Brain Flow Field',
  //   description: 'GPGPU flow field particles driven by brain.glb',
  //   tags: ['r3f', 'gpgpu', 'particles']
  // },

  //   {
  //   order: 16,
  //   slug: 'interpreter-lab',
  //   file: 'interpreter-lab/index.tsx',
  //   title: 'Interpreter Lab',
  //   description: 'Minimal editor with a collapsible inspection rail for lexing, parsing, evaluation, and types.',
  //   tags: ['ui', 'editor', 'interpreter'],
  //   background: 'none'
  // },
];

export const getExperimentBySlug = (slug: string) =>
  experimentsConfig.find((experiment) => experiment.slug === slug);

export const getExperimentImportPath = (experiment: ExperimentConfig) => {
  let path = experiment.file;

  if (path.endsWith('/index.tsx')) {
    return path.slice(0, -'/index.tsx'.length);
  }
  if (path.endsWith('/index.jsx')) {
    return path.slice(0, -'/index.jsx'.length);
  }
  if (path.endsWith('/index.ts')) {
    return path.slice(0, -'/index.ts'.length);
  }
  if (path.endsWith('/index.js')) {
    return path.slice(0, -'/index.js'.length);
  }
  if (path.endsWith('.tsx')) {
    return path.slice(0, -'.tsx'.length);
  }
  if (path.endsWith('.jsx')) {
    return path.slice(0, -'.jsx'.length);
  }
  if (path.endsWith('.ts')) {
    return path.slice(0, -'.ts'.length);
  }
  if (path.endsWith('.js')) {
    return path.slice(0, -'.js'.length);
  }

  return path;
};
