import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download, FileSpreadsheet, Plus, Save, X, Edit, Trash2, Check, MoreVertical, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { notFound } from "next/navigation"
import { WorkItemsPageClient } from "@/components/work-items-page-client"

export default async function WorkItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [estimate, units, rates, allWorkItems] = await Promise.all([
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
    prisma.workItem.findMany({
      include: {
        unit: true,
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
          }
        }
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
            <div className="flex items-center gap-2">
              <Link href={`/estimates/${id}/detailed`}>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Detailed View
                </Button>
              </Link>
              <Link href={`/estimates/${id}/abstract`}>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  View Abstract
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/api/estimates/${id}/export/pdf`}
                      target="_blank"
                      className="cursor-pointer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/api/estimates/${id}/export/excel`}
                      target="_blank"
                      className="cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/api/estimates/${id}/export/detailed-pdf`}
                      target="_blank"
                      className="cursor-pointer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Detailed PDF
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/api/estimates/${id}/export/detailed-excel`}
                      target="_blank"
                      className="cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Detailed Excel
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        <WorkItemsPageClient 
          estimate={estimate} 
          units={units} 
          rates={rates}
          allWorkItems={allWorkItems}
        />
      </div>
    </div>
  )
}
