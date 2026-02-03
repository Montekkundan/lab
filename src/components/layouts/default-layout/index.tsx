import { FC } from 'react'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './default-layout.module.scss'

type DefaultLayoutProps = NavigationLayoutProps & {
  background?: 'white' | 'dots' | 'dots_white' | 'none'
}

export const DefaultLayout: FC<DefaultLayoutProps> = ({
  children,
  title,
  description,
  slug,
  background = 'white',
  notebookPath
}) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug} notebookPath={notebookPath}>
      <div className={`${s['container']} ${s[`bg-${background}`]}`}>
        <div className={s['content']}>
          {children}
        </div>
      </div>
    </NavigationLayout>
  )
}
