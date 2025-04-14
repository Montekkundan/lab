import { Stats } from '@react-three/drei'
import { Canvas, CanvasProps } from '@react-three/fiber'
import { FC, ReactNode } from 'react'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './r3f-canvas-layout.module.scss'

export type R3FCanvasLayoutProps = NavigationLayoutProps & {
  htmlChildren?: ReactNode,
  bg?: string
} & CanvasProps

export const R3FCanvasLayout: FC<R3FCanvasLayoutProps> = ({
  children,
  title,
  description,
  slug,
  htmlChildren,
  bg,
  ...rest
}) => {
  const componentProps = bg || 'transparent';
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      {htmlChildren}
      <div style={{ position: 'fixed', height: '100vh', width: '100vw', background: componentProps }}>
        <Canvas style={{ background: componentProps }} {...rest}>
          <Stats className={s['stats']} />
          {children}
        </Canvas>
      </div>
    </NavigationLayout>
  )
}