'use client'

import React, { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DefaultLayout } from '../../components/layouts/default-layout'

const TabIcon = () => (
  <svg
    viewBox="0 0 20 20"
    className="h-3.5 w-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 10h9" />
    <path d="M11 6l4 4-4 4" />
    <path d="M17 5v10" />
  </svg>
)

const SUGGESTIONS = [
  ' that reads like a quiet thought.',
  ' that fades in with confidence.',
  ' that feels calm and intentional.'
]

function getSuggestion(text: string) {
  const trimmed = text.replace(/\s+$/, '')
  if (!trimmed) return ''

  const index = trimmed.length % SUGGESTIONS.length
  return SUGGESTIONS[index]
}

function LstmGhostText() {
  const [value, setValue] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)

  const suggestion = useMemo(() => {
    if (dismissed) return ''
    return getSuggestion(value)
  }, [dismissed, value])

  const acceptSuggestion = () => {
    if (!suggestion) return
    const next = `${value}${suggestion}`
    setValue(next)
    setDismissed(false)

    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.scrollTop = el.scrollHeight
      el.selectionStart = next.length
      el.selectionEnd = next.length
    })
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-[560px] px-4">
        <div className="relative">
          <motion.div
            className="pointer-events-none absolute -inset-3 rounded-[28px] bg-black/5 blur-2xl"
            animate={{ opacity: focused ? 0.9 : 0.45 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className="relative rounded-2xl border border-black/10 bg-white/80 p-5 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur-xl"
            animate={{
              borderColor: focused ? 'rgba(15, 23, 42, 0.18)' : 'rgba(15, 23, 42, 0.08)'
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative flex min-h-[28px] items-center justify-between pb-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500/80">
                LSTM Draft
              </div>
              <div className="invisible flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium">
                <span>Tab</span>
                <TabIcon />
              </div>
              <AnimatePresence>
                {suggestion ? (
                  <motion.div
                    className="absolute right-0 top-0 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-neutral-500"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span>Tab</span>
                    <TabIcon />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative h-[170px] overflow-hidden rounded-xl">
              <div className="pointer-events-none absolute inset-0 overflow-hidden px-4 py-3">
                <div
                  ref={ghostRef}
                  className="h-full overflow-hidden whitespace-pre-wrap break-words text-[15px] leading-6 text-neutral-400/70"
                >
                  <span className="text-transparent">{value || ' '}</span>
                  <span>{suggestion}</span>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setDismissed(false)
                  requestAnimationFrame(() => {
                    const el = textareaRef.current
                    if (!el) return
                    el.scrollTop = el.scrollHeight
                  })
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === 'Tab' && suggestion) {
                    event.preventDefault()
                    acceptSuggestion()
                  }

                  if (event.key === 'Escape' && suggestion) {
                    event.preventDefault()
                    setDismissed(true)
                  }
                }}
                placeholder="Start typing to see a gentle suggestion..."
                onScroll={(event) => {
                  if (!ghostRef.current) return
                  ghostRef.current.scrollTop = event.currentTarget.scrollTop
                }}
                className="relative z-10 h-full w-full resize-none overflow-y-auto rounded-xl bg-transparent px-4 py-3 text-[15px] leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 text-[12px] text-neutral-500/80">
              <span>Ghost text previews what your LSTM will suggest.</span>
              <span className="hidden sm:inline">Esc to dismiss</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

LstmGhostText.Layout = DefaultLayout
LstmGhostText.Title = 'LSTM Ghost Text'
LstmGhostText.Description = 'Minimal compose card with ghost-text suggestions.'
LstmGhostText.Tags = ['ui', 'motion', 'typography']

export default LstmGhostText
