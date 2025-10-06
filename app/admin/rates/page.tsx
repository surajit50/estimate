import { prisma } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { RatesTable } from "@/components/rates-table"

export default async function AdminRatesPage() {
  const [rates, units] = await Promise.all([
    prisma.rateLibrary.findMany({
      include: {
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.unitMaster.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h2 className="text-2xl font-semibold text-foreground">Rate Library</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Manage standard rates for different work items and materials
            </p>
          </div>
          <div className="animate-fade-in">
            <RatesTable rates={rates} units={units} />
          </div>
        </div>
      </main>
    </div>
  )
}