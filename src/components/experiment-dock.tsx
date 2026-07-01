"use client"

import { useCallback, useEffect, useMemo, useSyncExternalStore, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

export type ExperimentDockItem = {
  href: string
  slug: string
  title: string
}

type ExperimentDockProps = {
  currentSlug?: string
  items: ExperimentDockItem[]
}

const DOCK_MODE_KEY = "lab:experiment-dock"
const DOCK_MODE_EVENT = "lab:experiment-dock-change"

const getDockModeSnapshot = () =>
  typeof window !== "undefined" && sessionStorage.getItem(DOCK_MODE_KEY) === "active"

const getDockModeServerSnapshot = () => false

const notifyDockModeChange = () => {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(DOCK_MODE_EVENT))
}

const setDockModeActive = (active: boolean) => {
  if (typeof window === "undefined") return

  if (active) {
    sessionStorage.setItem(DOCK_MODE_KEY, "active")
  } else {
    sessionStorage.removeItem(DOCK_MODE_KEY)
  }

  notifyDockModeChange()
}

const subscribeDockMode = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {}

  const onDockModeChange = () => onStoreChange()
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === sessionStorage && event.key === DOCK_MODE_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener(DOCK_MODE_EVENT, onDockModeChange)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(DOCK_MODE_EVENT, onDockModeChange)
    window.removeEventListener("storage", onStorage)
  }
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
}

export function ExperimentDock({ currentSlug, items }: ExperimentDockProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const dockActive = useSyncExternalStore(
    subscribeDockMode,
    getDockModeSnapshot,
    getDockModeServerSnapshot
  )
  const currentIndex = currentSlug
    ? items.findIndex((item) => item.slug === currentSlug)
    : -1

  const isExperimentPage = currentIndex >= 0
  const firstItem = items[0]
  const previousItem = useMemo(() => {
    if (!isExperimentPage) return undefined
    return items[(currentIndex - 1 + items.length) % items.length]
  }, [currentIndex, isExperimentPage, items])
  const nextItem = useMemo(() => {
    if (!isExperimentPage) return undefined
    return items[(currentIndex + 1) % items.length]
  }, [currentIndex, isExperimentPage, items])

  const navigate = useCallback((href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }, [router, startTransition])

  useEffect(() => {
    for (const item of items) {
      router.prefetch(item.href)
    }
    router.prefetch("/")
  }, [items, router])

  useEffect(() => {
    if (!isExperimentPage) {
      setDockModeActive(false)
    }
  }, [isExperimentPage])

  const enterDock = useCallback(() => {
    if (!firstItem) return

    setDockModeActive(true)
    navigate(firstItem.href)
  }, [firstItem, navigate])

  const exitDock = useCallback(() => {
    setDockModeActive(false)
    navigate("/")
  }, [navigate])

  const navigateWithinDock = useCallback((href: string) => {
    setDockModeActive(true)
    navigate(href)
  }, [navigate])

  useEffect(() => {
    if (isExperimentPage && !dockActive) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableTarget(event.target)) return

      if (!isExperimentPage && event.key === "Enter" && firstItem) {
        event.preventDefault()
        enterDock()
        return
      }

      if (!isExperimentPage || !dockActive) return

      if (event.key === "Escape") {
        event.preventDefault()
        exitDock()
        return
      }

      if (event.key === "ArrowLeft" && previousItem) {
        event.preventDefault()
        navigateWithinDock(previousItem.href)
        return
      }

      if (event.key === "ArrowRight" && nextItem) {
        event.preventDefault()
        navigateWithinDock(nextItem.href)
      }
    }

    document.addEventListener("keydown", onKeyDown, { capture: true })
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true })
  }, [
    dockActive,
    enterDock,
    exitDock,
    firstItem,
    isExperimentPage,
    navigateWithinDock,
    nextItem,
    previousItem,
  ])

  if (items.length === 0) return null

  const buttonClassName =
    "h-7 min-w-7 rounded-none border border-white/10 bg-white/[0.06] px-1.5 text-white/80 shadow-none hover:bg-white/[0.12] hover:text-white disabled:opacity-40"
  const kbdClassName =
    "h-5 min-w-5 rounded-none border-0 bg-transparent px-1 text-[10px] text-white/75"

  if (!isExperimentPage) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
        <div
          data-testid="experiment-dock"
          className="pointer-events-auto flex items-center border border-white/10 bg-[#151515] p-1"
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Enter experiments"
            className={buttonClassName}
            onClick={enterDock}
          >
            <Kbd className={kbdClassName}>Enter</Kbd>
          </Button>
        </div>
      </div>
    )
  }

  if (!dockActive) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
      <div
        data-testid="experiment-dock"
        className="pointer-events-auto flex items-center border border-white/10 bg-[#151515] p-1"
      >
        <KbdGroup className="gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Exit experiments"
            className={buttonClassName}
            onClick={exitDock}
          >
            <Kbd className={kbdClassName}>Esc</Kbd>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Previous experiment"
            disabled={!previousItem}
            className={buttonClassName}
            onClick={() => previousItem && navigateWithinDock(previousItem.href)}
          >
            <Kbd className={kbdClassName}>←</Kbd>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Next experiment"
            disabled={!nextItem}
            className={buttonClassName}
            onClick={() => nextItem && navigateWithinDock(nextItem.href)}
          >
            <Kbd className={kbdClassName}>→</Kbd>
          </Button>
        </KbdGroup>
      </div>
    </div>
  )
}
