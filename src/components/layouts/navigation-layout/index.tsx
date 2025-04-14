import Link from 'next/link'
import React, { FC, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Formated } from '@/components/common/formated'
import { getExampleGithubUrl } from '@/lib/utils'

export type NavigationLayoutProps = {
  title?: string
  description?: string
  slug: string
  children: React.ReactNode
  bg?: string
}

export const NavigationLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }
  
  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start max-w-md">
        <button 
          onClick={toggleCollapse} 
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm mt-2 shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200"
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-5 shadow-lg w-full overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  duration: 0.4,
                  ease: [0.19, 1.0, 0.22, 1.0]  
                }
              }}
              exit={{ 
                opacity: 0, 
                y: 10, 
                scale: 0.97,
                transition: {
                  duration: 0.3,
                  ease: [0.4, 0.0, 0.2, 1.0] 
                }
              }}
            >
              <div ref={contentRef} className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
                {title && (
                  <div className="flex justify-between items-center mb-4 gap-2">
                    <h1 className="text-2xl font-bold m-0">{title}</h1>
                    <a 
                      href={getExampleGithubUrl(slug)} 
                      title="source code"
                      className="bg-accent text-accent-foreground border border-border rounded px-2 py-1 text-xs hover:opacity-90 hover:scale-105 transition-all duration-200"
                    >
                      {'<>'}
                    </a>
                  </div>
                )}
                
                {description && (
                  <div className="mb-6 text-muted-foreground">
                    <Formated>
                      {typeof description === 'string' ? (
                        <p>{description}</p>
                      ) : (
                        description
                      )}
                    </Formated>
                  </div>
                )}
                
                <div className="mt-6 border-t border-border pt-4">
                  <Link 
                    href="/" 
                    className="text-foreground hover:underline inline-block text-sm"
                  >
                    ← Back to lab ☢️
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {children}
    </>
  )
}
