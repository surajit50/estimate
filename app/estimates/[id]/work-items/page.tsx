import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WorkItemsManager } from "@/components/work-items-manager"
import { notFound } from "next/navigation"

export default async function WorkItemsPage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const [estimate, units, rates] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id },
      include: {
        workItems: {
          include: {
            unit: true,
          },
          orderBy: { itemNo: "asc" },
        },
      },
    }),
    prisma.unitMaster.findMany({
      orderBy: { unitName: "asc" },
    }),
    prisma.rateLibrary.findMany({
      include: {
        unit: true,
      },
      orderBy: { description: "asc" },
    }),
  ])

  if (!estimate) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/estimates/${id}/abstract`}>
            <Button>View Abstract</Button>
          </Link>
        </div>
        <WorkItemsManager estimate={estimate} units={units} rates={rates} />
      </div>
    </div>
  )
}
