export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'
export const isClient = typeof document !== 'undefined'
export const isServer = !isClient
export const safeWindow = isClient ? window : ({} as Window & typeof globalThis)

if (typeof process.env.NEXT_PUBLIC_SITE_URL !== 'string') {
  throw new Error(
    `NEXT_PUBLIC_SITE_URL is not defined.`
  )
}

export const siteURL = new URL(process.env.NEXT_PUBLIC_SITE_URL)
export const siteOrigin = siteURL.origin
export const githubUrl = 'https://github.com/montekkundan/lab'

export const montekLog = `


   ███╗   ███╗
   ████╗ ████║
   ██╔████╔██║
   ██║╚██╔╝██║
   ██║ ╚═╝ ██║
   ╚═╝     ╚═╝
                                                                         
   hi! 👋
`

export const defaultMeta = {
  title: 'Experiments | lab.montek.dev',
  description: `Montek's experimental corner.`,
  ogImage: `${siteOrigin}/og.png`,
  twitter: {
    handle: '@montekkundan',
    site: '@montekkundan'
  }
}