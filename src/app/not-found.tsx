import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn’t exist or was moved.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
