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

const resolveLayout = (Comp: Module<Component>): GetLayoutFn => {
  const Component = Comp.default

  if (Component?.getLayout) {
    return Component.getLayout
  }

  if (Component?.Layout) {
    if (Component.Layout === R3FCanvasLayout) {
      const R3FLayoutWrapper: React.FC<{ Component: Component, title?: string, description?: React.ReactNode, slug: string, notebookPath?: string, background?: string, bg?: string }> = ({ Component, title, description, slug, notebookPath }) => (
        <R3FCanvasLayout 
          slug={slug} 
          title={title} 
          description={description}
          notebookPath={notebookPath}
          bg={Component.bg}
        >
          <Component />
        </R3FCanvasLayout>
      )
      R3FLayoutWrapper.displayName = 'R3FLayoutWrapper'
      return R3FLayoutWrapper
    }
  
      const LayoutWrapper: React.FC<{ Component: Component, title?: string, description?: React.ReactNode, slug: string, notebookPath?: string, background?: 'white' | 'dots' | 'dots_white' | 'none' }> = ({ Component, title, description, slug, notebookPath, background }) => {
        const Layout = Component.Layout;
        if (!Layout) return null;
        
        return (
          <Layout 
            slug={slug} 
            title={title} 
            description={description} 
            notebookPath={notebookPath}
            background={background || Component.background}
          >
            <Component />
          </Layout>
        );
      }
    LayoutWrapper.displayName = 'LayoutWrapper'
    return LayoutWrapper
  }

  const DefaultReactLayout: React.FC<{ Component: Component, title?: string, description?: React.ReactNode, slug: string, notebookPath?: string }> = ({ Component, title, description, slug, notebookPath }) => (
    <DefaultLayout slug={slug} title={title} description={description} notebookPath={notebookPath}>
      <Component />
    </DefaultLayout>
  )
  DefaultReactLayout.displayName = 'DefaultReactLayout'
  return DefaultReactLayout
}

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
  const Layout = resolveLayout(Module)

  return (
    <Layout
      Component={Module.default}
      title={Module.default.Title}
      description={Module.default.Description}
      slug={slug}
      notebookPath={Module.default.Notebook}
      background={Module.default.background}
    />
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
