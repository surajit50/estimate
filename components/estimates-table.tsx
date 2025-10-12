"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, FileText, PlusCircle } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { DeleteEstimateDialog } from "@/components/delete-estimate-dialog"
import { deleteEstimate } from "@/lib/actions/estimates"

interface Estimate {
  id: string
  title: string
  category: string
  location: string | null
  createdAt: Date
  workItems: any[]
}

interface EstimatesTableProps {
  estimates: Estimate[]
}

export function EstimatesTable({ estimates: initialEstimates }: EstimatesTableProps) {
  const [estimates, setEstimates] = useState(initialEstimates)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    const result = await deleteEstimate(id)

    if (result.success) {
      setEstimates(estimates.filter((e) => e.id !== id))
      setDeleteId(null)
    } else {
      console.error("Error deleting estimate:", result.error)
    }
  }

  const calculateTotal = (workItems: any[]) => {
    return workItems.reduce((sum, item) => sum + item.amount, 0)
  }

  return (
    <>
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold">All Estimates</CardTitle>
              <p className="text-muted-foreground text-sm">
                {estimates.length} estimate{estimates.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Link href="/estimates/new">
              <Button className="group">
                <PlusCircle className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                Create New Estimate
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12 text-muted-foreground" />}
              title="No estimates yet"
              description="Get started by creating your first construction estimate. Track costs, manage work items, and generate professional reports."
              action={{
                label: "Create Your First Estimate",
                onClick: () => window.location.href = "/estimates/new"
              }}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold text-center">Items</TableHead>
                    <TableHead className="font-semibold">Total Amount</TableHead>
                    <TableHead className="font-semibold">Created Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((estimate) => (
                    <TableRow key={estimate.id} className="group hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">
                        {estimate.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {estimate.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {estimate.location || <span className="italic">Not specified</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary font-semibold rounded-full text-sm">
                          {estimate.workItems.length}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        ₹{calculateTotal(estimate.workItems).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(estimate.createdAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Link href={`/estimates/${estimate.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 flex items-center justify-center"
                              title="View Estimate"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/estimates/${estimate.id}/edit`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 flex items-center justify-center"
                              title="Edit Estimate"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/estimates/${estimate.id}/abstract`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 flex items-center justify-center"
                              title="View Abstract"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDeleteId(estimate.id)}
                            className="h-8 w-8 p-0 flex items-center justify-center text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete Estimate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteEstimateDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </>
  )
}
