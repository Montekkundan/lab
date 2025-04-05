import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { FC, useEffect, useState } from 'react'

import { Meta } from '@/components/common/meta'
import { R3FCanvasLayout } from '@/components/layouts/r3f-layput'
import { HTMLLayout } from '@/components/layouts/html-layout' 
import { DefaultLayout } from '@/components/layouts/default-layout'
import { getAllExperimentSlugs } from '@/lib/utils'

type Module<P> = {
  default: P
}

interface ExtendedFC<P = Record<string, unknown>> extends FC<P> {
  Layout?: FC<any>
  getLayout?: GetLayoutFn<P>
  Title?: string
  Description?: string
  background?: 'white' | 'dots' | 'dots_white' | 'none'
  htmlSrc?: string
  cssSrc?: string
  jsSrc?: string
}

type Component<P = Record<string, unknown>> = ExtendedFC<P>

type GetLayoutFn<P = Record<string, unknown>> = FC<{
  Component: Component<P>
  title?: string
  description?: string
  slug: string
  background?: 'white' | 'dots' | 'dots_white' | 'none'
  htmlSrc?: string
  cssSrc?: string
  jsSrc?: string
}>

const resolveLayout = (Comp: Module<Component>): GetLayoutFn => {
  const Component = Comp.default

  if (Component?.getLayout) {
    return Component.getLayout
  }

  if (Component?.Layout) {
    // Check for specific layouts based on properties
    if (Component.Layout === HTMLLayout) {
      // Named function expression to fix ESLint display-name warning
      const HTMLLayoutWrapper: FC<{ Component: Component, title?: string, description?: string, slug: string }> = ({ Component, title, description, slug }) => (
        <HTMLLayout 
          slug={slug} 
          title={title} 
          description={description}
          htmlSrc={Component.htmlSrc} 
          cssSrc={Component.cssSrc} 
          jsSrc={Component.jsSrc}
        >
          <Component />
        </HTMLLayout>
      )
      HTMLLayoutWrapper.displayName = 'HTMLLayoutWrapper'
      return HTMLLayoutWrapper
    }

    // Named function expression to fix ESLint display-name warning
    const LayoutWrapper: FC<{ Component: Component, title?: string, description?: string, slug: string, background?: string }> = ({ Component, title, description, slug, background }) => (
      <Component.Layout 
        slug={slug} 
        title={title} 
        description={description} 
        background={background || Component.background}
      >
        <Component />
      </Component.Layout>
    )
    LayoutWrapper.displayName = 'LayoutWrapper'
    return LayoutWrapper
  }

  // Default layout is R3F Canvas
  const DefaultR3FLayout: FC<{ Component: Component, title?: string, description?: string, slug: string }> = ({ Component, title, description, slug }) => (
    <R3FCanvasLayout slug={slug} title={title} description={description}>
      <Component />
    </R3FCanvasLayout>
  )
  DefaultR3FLayout.displayName = 'DefaultR3FLayout'
  return DefaultR3FLayout
}

const Experiment = ({
  slug
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [Component, setComponent] = useState<Module<Component>>()

  useEffect(() => {
    import(`@/experiments/${slug}`).then((Comp) => {
      setComponent(Comp)
    })
  }, [slug])

  if (!Component) {
    return (
      <>
        <Meta />
        <div>Loading...</div>
      </>
    )
  }

  const Layout = resolveLayout(Component)

  return (
    <>
      <Meta />
      <Layout
        Component={Component.default}
        title={Component.default.Title}
        description={Component.default.Description}
        slug={slug}
        background={Component.default.background}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allSlugs = await getAllExperimentSlugs()

  const paths = allSlugs.map((exp) => {
    return {
      params: {
        slug: exp
      }
    }
  })

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = ({ params }) => {
  return {
    props: {
      slug: (params as ParsedUrlQuery).slug
    }
  }
}

export default Experiment