import { LabWordmark } from "@/components/lab-wordmark"

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <LabWordmark className="inline-flex items-center text-foreground" />
    </header>
  )
}
