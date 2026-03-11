'use client'

import { Suspense, use, useMemo } from 'react'
import { R3FCanvasLayout } from '@/components/layouts/r3f-layput'
import { DefaultLayout } from '@/components/layouts/default-layout'
import { experimentImportMap, type ExperimentLoader, type ExperimentModule } from '@/lib/experiments.import-map'

type Module<P> = {
  default: P
}

interface ExtendedFC<P = Record<string, unknown>> extends React.FC<P> {
  Layout?: React.FC<{
    children: React.ReactNode;
    slug: string;
    title?: string;
    description?: React.ReactNode;
    notebookPath?: string;
    background?: 'white' | 'dots' | 'dots_white' | 'none';
  }>
  getLayout?: GetLayoutFn<P>
  Title?: string
  Description?: React.ReactNode
  Tags?: string[]
  Notebook?: string
  background?: 'white' | 'dots' | 'dots_white' | 'none'
  og?: string
  bg?: string
}

type Component<P = Record<string, unknown>> = ExtendedFC<P>

type GetLayoutFn<P = Record<string, unknown>> = React.FC<{
  Component: Component<P>
  title?: string
  description?: React.ReactNode
  slug: string
  notebookPath?: string
  background?: 'white' | 'dots' | 'dots_white' | 'none'
  bg?: string
}>

type ExperimentClientProps = {
  slug: string
}

type ExperimentClientContentProps = {
  slug: string
  loader: ExperimentLoader
}

function ExperimentClientContent({ slug, loader }: ExperimentClientContentProps) {
  const modulePromise = useMemo(() => loader() as Promise<ExperimentModule>, [loader])
  const Module = use(modulePromise) as Module<Component>
  const Component = Module.default

  if (Component?.getLayout) {
    const Layout = Component.getLayout
    return (
      <Layout
        Component={Component}
        title={Component.Title}
        description={Component.Description}
        slug={slug}
        notebookPath={Component.Notebook}
        background={Component.background}
        bg={Component.bg}
      />
    )
  }

  if (Component?.Layout === R3FCanvasLayout) {
    return (
      <R3FCanvasLayout
        slug={slug}
        title={Component.Title}
        description={Component.Description}
        notebookPath={Component.Notebook}
        bg={Component.bg}
      >
        <Component />
      </R3FCanvasLayout>
    )
  }

  if (Component?.Layout) {
    const Layout = Component.Layout
    return (
      <Layout
        slug={slug}
        title={Component.Title}
        description={Component.Description}
        notebookPath={Component.Notebook}
        background={Component.background}
      >
        <Component />
      </Layout>
    )
  }

  return (
    <DefaultLayout
      slug={slug}
      title={Component.Title}
      description={Component.Description}
      notebookPath={Component.Notebook}
    >
      <Component />
    </DefaultLayout>
  )
}

export default function ExperimentClient({ slug }: ExperimentClientProps) {
  const loader = (experimentImportMap as Record<string, ExperimentLoader>)[slug]

  if (!loader) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Experiment Not Found</h1>
        <p>Sorry, the experiment &quot;{slug}&quot; could not be loaded.</p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <ExperimentClientContent slug={slug} loader={loader} />
    </Suspense>
  )
}
