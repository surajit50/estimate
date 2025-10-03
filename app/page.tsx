import { prisma } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { EstimatesTable } from "@/components/estimates-table"

export default async function DashboardPage() {
  const estimates = await prisma.estimate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      workItems: true,
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <EstimatesTable estimates={estimates} />
      </main>
    </div>
  )
}
