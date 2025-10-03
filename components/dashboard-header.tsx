import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, DollarSign, Ruler } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estimate Preparation System</h1>
            <p className="text-muted-foreground mt-1">Manage construction estimates and work items</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/units">
              <Button variant="outline" size="sm">
                <Ruler className="h-4 w-4 mr-2" />
                Unit Master
              </Button>
            </Link>
            <Link href="/admin/rates">
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Rate Library
              </Button>
            </Link>
            <Link href="/estimates/new">
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Estimate
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
