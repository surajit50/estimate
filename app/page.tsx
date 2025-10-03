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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h2 className="text-2xl font-semibold text-foreground">Your Estimates</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create, manage, and track your construction estimates with our comprehensive system
            </p>
          </div>
          <div className="animate-fade-in">
            <EstimatesTable estimates={estimates} />
          </div>
        </div>
      </main>
    </div>
  )
}
