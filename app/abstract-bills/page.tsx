import { prisma } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { AbstractBillsTable } from "@/components/abstract-bills-table"

export default async function AbstractBillsPage() {
  const abstractBills = await prisma.abstractBill.findMany({
    include: {
      measurementBook: {
        include: {
          estimate: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      },
      items: {
        include: {
          unit: true,
          measurementEntry: true,
        },
      },
    },
    orderBy: { billDate: "desc" },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h2 className="text-2xl font-semibold text-foreground">Abstract Bills</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Generate and manage abstract bills based on measurement book entries for accurate billing and payment processing
            </p>
          </div>
          <div className="animate-fade-in">
            <AbstractBillsTable abstractBills={abstractBills} />
          </div>
        </div>
      </main>
    </div>
  )
}
