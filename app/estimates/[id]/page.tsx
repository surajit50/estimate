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

export default async function ViewEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
                <div className="flex-1">
                  <CardTitle className="text-2xl">{estimate.title}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary">{estimate.category}</Badge>
                    {estimate.location && <Badge variant="outline">{estimate.location}</Badge>}
                    <Badge variant={estimate.status === 'completed' ? 'default' : estimate.status === 'approved' ? 'default' : 'secondary'}>
                      {estimate.status?.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={estimate.priority === 'urgent' ? 'destructive' : estimate.priority === 'high' ? 'destructive' : 'outline'}>
                      {estimate.priority?.toUpperCase()}
                    </Badge>
                  </div>
                  {estimate.description && <p className="text-sm text-muted-foreground mt-2">{estimate.description}</p>}
                  
                  {/* Tags */}
                  {estimate.tags && estimate.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {estimate.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold">{format(new Date(estimate.createdAt), "dd MMM yyyy")}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Client Information */}
          {(estimate.clientName || estimate.clientContact || estimate.clientEmail || estimate.clientAddress) && (
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estimate.clientName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Client Name</p>
                      <p className="font-medium">{estimate.clientName}</p>
                    </div>
                  )}
                  {estimate.clientContact && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{estimate.clientContact}</p>
                    </div>
                  )}
                  {estimate.clientEmail && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{estimate.clientEmail}</p>
                    </div>
                  )}
                  {estimate.clientAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{estimate.clientAddress}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Timeline */}
          {(estimate.startDate || estimate.endDate || estimate.duration) && (
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {estimate.startDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(estimate.startDate), "dd MMM yyyy")}</p>
                    </div>
                  )}
                  {estimate.endDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(new Date(estimate.endDate), "dd MMM yyyy")}</p>
                    </div>
                  )}
                  {estimate.duration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{estimate.duration} days</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Information */}
          {(estimate.estimatedBudget || estimate.actualCost || estimate.contingency || estimate.overhead || estimate.profitMargin || estimate.discount) && (
            <Card>
              <CardHeader>
                <CardTitle>Budget & Financial Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {estimate.estimatedBudget > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Budget</p>
                      <p className="font-medium">₹{estimate.estimatedBudget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {estimate.actualCost > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Cost</p>
                      <p className="font-medium">₹{estimate.actualCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {estimate.contingency > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contingency</p>
                      <p className="font-medium">₹{estimate.contingency.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {estimate.overhead > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Overhead</p>
                      <p className="font-medium">₹{estimate.overhead.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {estimate.profitMargin > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                      <p className="font-medium">{estimate.profitMargin}%</p>
                    </div>
                  )}
                  {estimate.discount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Discount</p>
                      <p className="font-medium">₹{estimate.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CGST</p>
                  <p className="font-medium">{estimate.cgstPercent}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SGST</p>
                  <p className="font-medium">{estimate.sgstPercent}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">L.W. Cess</p>
                  <p className="font-medium">{estimate.cessPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {estimate.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
              </CardContent>
            </Card>
          )}

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
                        <TableHead className="text-right">Material (₹)</TableHead>
                        <TableHead className="text-right">Labor (₹)</TableHead>
                        <TableHead className="text-right">Equipment (₹)</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimate.workItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemNo}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.description}</div>
                              {item.status && item.status !== 'active' && (
                                <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} className="text-xs mt-1">
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.unit.unitSymbol}</TableCell>
                          <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.materialCost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="text-right">{item.laborCost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="text-right">{item.equipmentCost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={8} className="text-right">
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
