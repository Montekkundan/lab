export type ExperimentConfig = {
  slug: string;
  file: string;
  createdAt: string;
  published?: boolean;
  title?: string;
  description?: string;
  tags?: string[];
  background?: 'white' | 'dots' | 'dots_white' | 'none';
  og?: string;
};

export const experimentsConfig: ExperimentConfig[] = [
  {
    slug: 'multilanguage',
    file: 'multilanguage/index.tsx',
    createdAt: '2024-04-10',
    title: 'Multi Language Translation',
    description: 'AI-powered multi-language translation tool',
    tags: ['ai', 'translation', 'ui'],
    background: 'dots'
  },
  {
    slug: 'ascii-cube',
    file: 'ascii-cube/index.tsx',
    createdAt: '2024-05-01',
    title: 'ASCII Cube',
    description: 'ASCII Cube',
    tags: ['ui', '3d'],
    background: 'dots'
  },
  {
    slug: 'shared-layout',
    file: 'shared-layout/index.js',
    createdAt: '2024-05-18',
    title: 'Shared layout',
    tags: ['framer motion', 'animation'],
    background: 'dots'
  },
  {
    slug: 'bashub-button',
    file: 'bashub-button/index.tsx',
    createdAt: '2024-06-03',
    title: 'Bashub Button',
    description: 'Built with Bashub Button',
    tags: ['ui'],
    background: 'dots',
    og: '/ogs/basehub-button.png'
  },
  {
    slug: 'ascii-knot',
    file: 'ascii-knot/index.tsx',
    createdAt: '2024-07-20',
    title: 'ASCII Knot',
    description: 'ASCII Knot',
    tags: ['ui', '3d'],
    background: 'dots'
  },
  {
    slug: 'shadcn-test',
    file: 'shadcn-test/index.tsx',
    createdAt: '2024-08-11',
    title: 'Shadcn Test',
    description: 'Testing Shadcn UI components',
    tags: ['ui', 'shadcn'],
    background: 'dots'
  },
  {
    slug: 'chai',
    file: 'Chai/index.jsx',
    createdAt: '2024-09-09',
    title: 'Chai',
    description: 'Chai',
    tags: ['r3f']
  },
  {
    slug: 'ascii-pyramid',
    file: 'ascii-pyramid/index.tsx',
    createdAt: '2024-09-26',
    title: 'ASCII Pyramid',
    description: 'ASCII Pyramid',
    tags: ['ui', '3d'],
    background: 'dots'
  },
  {
    slug: 'junior-dev',
    file: 'junior-dev/index.jsx',
    createdAt: '2024-10-15',
    title: 'Junior Dev',
    description: 'I am now a junior developer!',
    tags: ['r3f']
  },
  {
    slug: 'grease-pencil',
    file: 'grease_penciel/index.tsx',
    createdAt: '2024-11-08',
    title: 'Grease Pencil',
    description: 'Testing grease pencil in three.js',
    tags: ['r3f']
  },
  {
    slug: 'cube',
    file: 'cube.tsx',
    createdAt: '2024-12-03',
    title: 'Three.js Cube',
    description: 'This is just a cube',
    tags: ['r3f']
  },
  {
    slug: 'barnes-hut',
    file: 'barnes-hut/index.tsx',
    createdAt: '2025-01-17',
    title: 'Barnes-Hut N-Body Simulation',
    tags: ['simulation', 'physics', 'canvas', 'algorithm'],
    background: 'none'
  },
  {
    slug: 'vit-mnist-token-grid',
    file: 'vit-mnist-token-grid/index.tsx',
    createdAt: '2025-02-04',
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

export const isExperimentPublished = (experiment: ExperimentConfig) =>
  experiment.published !== false;

export const getExperimentBySlug = (slug: string) =>
  experimentsConfig.find((experiment) => experiment.slug === slug);

export const getExperimentDisplayTitle = (slug: string) => {
  const experiment = getExperimentBySlug(slug)
  if (experiment?.title) return experiment.title

  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const getExperimentImportPath = (experiment: ExperimentConfig) => {
  const path = experiment.file;

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
