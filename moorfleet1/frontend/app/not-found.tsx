import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <AlertTriangle className="h-24 w-24 text-muted-foreground" />
        </div>
        <div className="flex justify-center">
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <h2 className="text-xl font-semibold text-muted-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The mooring unit or page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
