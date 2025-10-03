import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UnitsTable } from "@/components/units-table"

export default async function UnitsPage() {
  const units = await prisma.unitMaster.findMany({
    orderBy: { unitName: "asc" },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <UnitsTable units={units} />
      </div>
    </div>
  )
}
