import { Stats } from '@react-three/drei'
import { Canvas, CanvasProps } from '@react-three/fiber'
import { FC, ReactNode } from 'react'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './r3f-canvas-layout.module.scss'
import { isDev } from '@/lib/constants'

export type R3FCanvasLayoutProps = NavigationLayoutProps & {
  htmlChildren?: ReactNode,
  bg?: string
} & CanvasProps

export const R3FCanvasLayout: FC<R3FCanvasLayoutProps> = ({
  children,
  title,
  description,
  slug,
  notebookPath,
  htmlChildren,
  bg,
  ...rest
}) => {
  const componentProps = bg || 'transparent'
  const dpr = rest.dpr ?? [1, 1.5]

  return (
    <NavigationLayout title={title} description={description} slug={slug} notebookPath={notebookPath}>
      {htmlChildren}
      <div style={{ position: 'fixed', height: '100vh', width: '100vw', background: componentProps }}>
        <Canvas style={{ background: componentProps }} dpr={dpr} {...rest}>
          {isDev ? <Stats className={s['stats']} /> : null}
          {children}
        </Canvas>
      </div>
    </NavigationLayout>
  )
}
