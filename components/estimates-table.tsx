"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, FileText } from "lucide-react"
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No estimates found. Create your first estimate to get started.</p>
              <Link href="/estimates/new">
                <Button className="mt-4">Create Estimate</Button>
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
                  <TableRow key={estimate.id}>
                    <TableCell className="font-medium">{estimate.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{estimate.category}</Badge>
                    </TableCell>
                    <TableCell>{estimate.location || "-"}</TableCell>
                    <TableCell>{estimate.workItems.length}</TableCell>
                    <TableCell>
                      ₹{calculateTotal(estimate.workItems).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{format(new Date(estimate.createdAt), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/estimates/${estimate.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/estimates/${estimate.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/estimates/${estimate.id}/abstract`}>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(estimate.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
