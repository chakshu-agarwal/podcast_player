import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
}
