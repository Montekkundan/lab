'use client'

import { useEffect, useState } from 'react'
import { R3FCanvasLayout } from '@/components/layouts/r3f-layput'
import { DefaultLayout } from '@/components/layouts/default-layout'

type Module<P> = {
  default: P
}

interface ExtendedFC<P = Record<string, unknown>> extends React.FC<P> {
  Layout?: React.FC<{
    children: React.ReactNode;
    slug: string;
    title?: string;
    description?: React.ReactNode;
    background?: 'white' | 'dots' | 'dots_white' | 'none';
  }>
  getLayout?: GetLayoutFn<P>
  Title?: string
  Description?: React.ReactNode
  Tags?: string[]
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
      const R3FLayoutWrapper: React.FC<{ Component: Component, title?: string, description?: React.ReactNode, slug: string, background?: string, bg?: string }> = ({ Component, title, description, slug }) => (
        <R3FCanvasLayout 
          slug={slug} 
          title={title} 
          description={description}
          bg={Component.bg}
        >
          <Component />
        </R3FCanvasLayout>
      )
      R3FLayoutWrapper.displayName = 'R3FLayoutWrapper'
      return R3FLayoutWrapper
    }
  
      const LayoutWrapper: React.FC<{ Component: Component, title?: string, description?: React.ReactNode, slug: string, background?: 'white' | 'dots' | 'dots_white' | 'none' }> = ({ Component, title, description, slug, background }) => {
        const Layout = Component.Layout;
        if (!Layout) return null;
        
        return (
          <Layout 
            slug={slug} 
            title={title} 
            description={description} 
            background={background || Component.background}
          >
            <Component />
          </Layout>
        );
      }
    LayoutWrapper.displayName = 'LayoutWrapper'
    return LayoutWrapper
  }

  const DefaultReactLayout: React.FC<{ Component: Component, title?: string, description?: React.ReactNode, slug: string }> = ({ Component, title, description, slug }) => (
    <DefaultLayout slug={slug} title={title} description={description}>
      <Component />
    </DefaultLayout>
  )
  DefaultReactLayout.displayName = 'DefaultReactLayout'
  return DefaultReactLayout
}

type ExperimentClientProps = {
  slug: string
  importPath: string
}

export default function ExperimentClient({ slug, importPath }: ExperimentClientProps) {
  const [Component, setComponent] = useState<Module<Component>>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadComponent() {
      try {
        const Comp = await import(`@/experiments/${importPath}`)
        setComponent(Comp)
      } catch (err) {
        console.error("Failed to load experiment:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    loadComponent()
  }, [importPath])

  if (error) {
    return <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Experiment Not Found</h1>
      <p>Sorry, the experiment &quot;{slug}&quot; could not be loaded.</p>
    </div>
  }

  if (loading || !Component) {
    return <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  const Layout = resolveLayout(Component)

  return (
    <Layout
      Component={Component.default}
      title={Component.default.Title}
      description={Component.default.Description}
      slug={slug}
      background={Component.default.background}
    />
  )
}
