import React from 'react'

type OgImageTemplateProps = {
  title: string
  description: string
}

export function OgImageTemplate({ title, description }: OgImageTemplateProps) {
  return (
    <div
      tw="w-full h-full flex flex-col justify-between bg-neutral-950 text-neutral-100 px-16 py-14"
      style={{
        background:
          'radial-gradient(1200px 630px at 10% 0%, rgba(56, 189, 248, 0.20), transparent 60%), radial-gradient(800px 400px at 100% 100%, rgba(34, 197, 94, 0.14), transparent 65%), #09090b',
      }}
    >
      <div tw="flex items-center text-[30px] font-medium tracking-tight text-cyan-300">
        montek lab
      </div>

      <div tw="flex flex-col gap-6">
        <p tw="text-[64px] leading-[1.05] font-bold tracking-tight text-white">
          {title}
        </p>
        <p tw="text-[28px] leading-[1.3] text-neutral-300 max-w-[1000px]">
          {description}
        </p>
      </div>

      <div tw="text-[24px] text-neutral-400">lab.montek.dev</div>
    </div>
  )
}
