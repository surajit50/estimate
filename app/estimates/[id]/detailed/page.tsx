import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { notFound } from "next/navigation"
import { DetailedView } from "@/components/detailed-view"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function DetailedEstimatePage({ params }: { params: { id: string } }) {
  const { id } = params
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      workItems: {
        include: {
          unit: true,
          subItems: true,
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
          <Link href={`/estimates/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Estimate
            </Button>
          </Link>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/api/estimates/${id}/export/detailed-pdf`}
                    target="_blank"
                    className="cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/api/estimates/${id}/export/detailed-excel`}
                    target="_blank"
                    className="cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as Excel
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href={`/estimates/${id}/abstract`}>
              <Button>View Abstract</Button>
            </Link>
          </div>
        </div>

        <DetailedView estimate={estimate} />
      </div>
    </div>
  )
}
