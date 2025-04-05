import { FC, useEffect, useRef } from 'react'

import { NavigationLayout, NavigationLayoutProps } from '../navigation-layout'
import s from './html-layout.module.scss'

type HTMLLayoutProps = NavigationLayoutProps & {
  htmlSrc?: string
  cssSrc?: string
  jsSrc?: string
}

export const HTMLLayout: FC<HTMLLayoutProps> = ({
  children,
  title,
  description,
  slug,
  htmlSrc,
  cssSrc,
  jsSrc
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const updateIframeContent = async () => {
      if (!iframeRef.current) return

      try {
        const htmlResponse = htmlSrc ? await fetch(htmlSrc) : null
        const cssResponse = cssSrc ? await fetch(cssSrc) : null
        const jsResponse = jsSrc ? await fetch(jsSrc) : null

        const htmlContent = htmlResponse ? await htmlResponse.text() : ''
        const cssContent = cssResponse ? await cssResponse.text() : ''
        const jsContent = jsResponse ? await jsResponse.text() : ''

        const doc = iframeRef.current.contentDocument
        if (doc) {
          doc.open()
          doc.write(htmlContent)
          
          // Inject CSS if available
          if (cssContent) {
            const style = doc.createElement('style')
            style.textContent = cssContent
            doc.head.appendChild(style)
          }
          
          // Inject JS if available
          if (jsContent) {
            const script = doc.createElement('script')
            script.textContent = jsContent
            doc.body.appendChild(script)
          }
          
          doc.close()
        }
      } catch (error) {
        console.error('Error loading HTML content:', error)
      }
    }

    updateIframeContent()
  }, [htmlSrc, cssSrc, jsSrc])

  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <div className={s['html-container']}>
        <iframe
          ref={iframeRef}
          className={s['html-iframe']}
          title={title || 'HTML Content'}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </NavigationLayout>
  )
}