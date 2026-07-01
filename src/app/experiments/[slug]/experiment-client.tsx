'use client'

import { useEffect, useState } from 'react'
import { R3FCanvasLayout } from '@/components/layouts/r3f-layput'
import { DefaultLayout } from '@/components/layouts/default-layout'
import { experimentImportMap, type ExperimentLoader } from '@/lib/experiments.import-map'

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

type LoadedExperiment = {
  slug: string
  module: Module<Component> | null
  error: Error | null
}

function ExperimentLoading() {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  )
}

function ExperimentClientContent({ slug, loader }: ExperimentClientContentProps) {
  const [loadedExperiment, setLoadedExperiment] = useState<LoadedExperiment | null>(null)

  useEffect(() => {
    let isMounted = true

    loader()
      .then((loadedModule) => {
        if (isMounted) {
          setLoadedExperiment({
            slug,
            module: loadedModule as Module<Component>,
            error: null
          })
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setLoadedExperiment({
            slug,
            module: null,
            error: loadError instanceof Error ? loadError : new Error('Failed to load experiment')
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [loader, slug])

  if (!loadedExperiment || loadedExperiment.slug !== slug) {
    return <ExperimentLoading />
  }

  if (loadedExperiment.error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Experiment Failed To Load</h1>
        <p>{loadedExperiment.error.message}</p>
      </div>
    )
  }

  if (!loadedExperiment.module) {
    return <ExperimentLoading />
  }

  const Component = loadedExperiment.module.default

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
      background={Component.background}
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
    <ExperimentClientContent slug={slug} loader={loader} />
  )
}
