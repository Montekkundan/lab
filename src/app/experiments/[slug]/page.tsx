'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
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
    description?: string;
    background?: 'white' | 'dots' | 'dots_white' | 'none';
  }>
  getLayout?: GetLayoutFn<P>
  Title?: string
  Description?: string
  Tags?: string[]
  background?: 'white' | 'dots' | 'dots_white' | 'none'
  og?: string
}

type Component<P = Record<string, unknown>> = ExtendedFC<P>

type GetLayoutFn<P = Record<string, unknown>> = React.FC<{
  Component: Component<P>
  title?: string
  description?: string
  slug: string
  background?: 'white' | 'dots' | 'dots_white' | 'none'
}>

const resolveLayout = (Comp: Module<Component>): GetLayoutFn => {
  const Component = Comp.default

  if (Component?.getLayout) {
    return Component.getLayout
  }

  if (Component?.Layout) {
    if (Component.Layout === R3FCanvasLayout) {
      const R3FLayoutWrapper: React.FC<{ Component: Component, title?: string, description?: string, slug: string, background?: string }> = ({ Component, title, description, slug }) => (
        <R3FCanvasLayout 
          slug={slug} 
          title={title} 
          description={description}
        >
          <Component />
        </R3FCanvasLayout>
      )
      R3FLayoutWrapper.displayName = 'R3FLayoutWrapper'
      return R3FLayoutWrapper
    }
  
      const LayoutWrapper: React.FC<{ Component: Component, title?: string, description?: string, slug: string, background?: 'white' | 'dots' | 'dots_white' | 'none' }> = ({ Component, title, description, slug, background }) => {
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

  // Default layout for React components
  const DefaultReactLayout: React.FC<{ Component: Component, title?: string, description?: string, slug: string }> = ({ Component, title, description, slug }) => (
    <DefaultLayout slug={slug} title={title} description={description}>
      <Component />
    </DefaultLayout>
  )
  DefaultReactLayout.displayName = 'DefaultReactLayout'
  return DefaultReactLayout
}

// Client-side experiment loader
export default function ExperimentPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // Unwrap the params with React.use() to handle both Promise and direct access cases
  const unwrappedParams = 'then' in params ? use(params) : params
  const { slug } = unwrappedParams
  const [Component, setComponent] = useState<Module<Component>>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadComponent() {
      try {
        // Try to load the component
        const Comp = await import(`@/experiments/${slug}`)
        setComponent(Comp)
      } catch (err) {
        console.error("Failed to load experiment:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    loadComponent()
  }, [slug])

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