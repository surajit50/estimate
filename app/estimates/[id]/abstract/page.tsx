import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react"
import { AbstractView } from "@/components/abstract-view"
import { notFound } from "next/navigation"

export default async function AbstractPage({ params }: { params: { id: string } }) {
  const { id } = params
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      workItems: {
        include: {
          unit: true,
        },
        orderBy: { itemNo: "asc" },
      },
    },
  })

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
          <div className="flex gap-2">
            <Link href={`/estimates/${id}/work-items`}>
              <Button variant="outline">Edit Work Items</Button>
            </Link>
            <Link href={`/api/estimates/${id}/export/pdf`} target="_blank">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </Link>
            <Link href={`/api/estimates/${id}/export/excel`} target="_blank">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </Link>
          </div>
        </div>
        <AbstractView estimate={estimate} />
      </div>
    </div>
  )
}
