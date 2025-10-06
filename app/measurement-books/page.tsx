import { prisma } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { MeasurementBooksTable } from "@/components/measurement-books-table"

export default async function MeasurementBooksPage() {
  const measurementBooks = await prisma.measurementBook.findMany({
    include: {
      estimate: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      entries: true,
      abstractBills: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4 animate-fade-in-up">
            <h2 className="text-2xl font-semibold text-foreground">Measurement Books</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track work progress and measurements for your construction projects with detailed entries and records
            </p>
          </div>
          <div className="animate-fade-in">
            <MeasurementBooksTable measurementBooks={measurementBooks} />
          </div>
        </div>
      </main>
    </div>
  )
}
