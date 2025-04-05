import Link from 'next/link'
import React, { FC, useState } from 'react'

import { Formated } from '@/components/common/formated'
import { getExampleGithubUrl } from '@/lib/utils'

import s from './navigation-layout.module.scss'

export type NavigationLayoutProps = {
  title?: string
  description?: string
  slug: string
  children: React.ReactNode
}

export const NavigationLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <>
      <button onClick={toggleCollapse} className={s['toggle-button']}>
        {isCollapsed ? 'Expand' : 'Collapse'}
      </button>
      {!isCollapsed && (
        <div className={s['layout']}>
          <Link href="/">← Back to lab ☢️</Link>
          <div className={s['heading']}>
            {title && <h1 className={s['title']}>{title}</h1>}
            {description && (
              <Formated className={s['description']}>
                {typeof description === 'string' ? (
                  <p>{description}</p>
                ) : (
                  description
                )}
              </Formated>
            )}
          </div>
        </div>
      )}
      <a href={getExampleGithubUrl(slug)} title="source code">
        <span className={s['source']}>{'<>'}</span>
      </a>
      {children}
    </>
  )
}
