import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, FileText, Download, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { notFound } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function ViewEstimatePage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
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

  const totalAmount = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)

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
            <Link href={`/estimates/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            </Link>
            <Link href={`/estimates/${id}/work-items`}>
              <Button variant="outline">Manage Work Items</Button>
            </Link>
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
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/api/estimates/${id}/export/pdf`} target="_blank" className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/api/estimates/${id}/export/excel`} target="_blank" className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Export as Excel
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-6">
          {/* Estimate Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{estimate.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{estimate.category}</Badge>
                    {estimate.location && <Badge variant="outline">{estimate.location}</Badge>}
                  </div>
                  {estimate.description && <p className="text-sm text-muted-foreground mt-2">{estimate.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold">{format(new Date(estimate.createdAt), "dd MMM yyyy")}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Work Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Work Items Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {estimate.workItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No work items added yet.</p>
                  <Link href={`/estimates/${id}/work-items`}>
                    <Button className="mt-4">Add Work Items</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate (₹)</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimate.workItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemNo}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.unit.unitSymbol}</TableCell>
                          <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={5} className="text-right">
                          Total Estimate:
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
