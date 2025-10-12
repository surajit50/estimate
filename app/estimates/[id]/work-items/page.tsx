import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WorkItemsManager } from "@/components/work-items-manager"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { notFound } from "next/navigation"

export default async function WorkItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
        <div className="mb-6 space-y-4">
          <BreadcrumbNav 
            items={[
              { label: "Estimates", href: "/" },
              { label: estimate.title, href: `/estimates/${id}` },
              { label: "Work Items", current: true }
            ]} 
          />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{estimate.title} - Work Items</h1>
              <p className="text-muted-foreground">Manage work items, quantities, and calculations</p>
            </div>
            <Link href={`/estimates/${id}/abstract`}>
              <Button>View Abstract</Button>
            </Link>
          </div>
        </div>
        <WorkItemsManager estimate={estimate} units={units} rates={rates} />
      </div>
    </div>
  )
}
