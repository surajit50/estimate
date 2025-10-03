"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, FileText, PlusCircle } from "lucide-react"
import { DeleteEstimateDialog } from "@/components/delete-estimate-dialog"

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
    const response = await fetch(`/api/estimates/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setEstimates(estimates.filter((e) => e.id !== id))
      setDeleteId(null)
    }
  }

  const calculateTotal = (workItems: any[]) => {
    return workItems.reduce((sum, item) => sum + item.amount, 0)
  }

  return (
    <>
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-bold">All Estimates</CardTitle>
          <p className="text-muted-foreground text-sm">
            {estimates.length} estimate{estimates.length !== 1 ? 's' : ''} found
          </p>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No estimates yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first construction estimate. Track costs, manage work items, and generate professional reports.
              </p>
              <Link href="/estimates/new">
                <Button size="lg" className="group">
                  <PlusCircle className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Create Your First Estimate
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((estimate) => (
                  <TableRow key={estimate.id} className="group hover:bg-muted/30">
                    <TableCell className="font-semibold text-foreground group-hover:text-primary transition-colors">
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/estimates/${estimate.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/estimates/${estimate.id}/edit`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/estimates/${estimate.id}/abstract`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDeleteId(estimate.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
