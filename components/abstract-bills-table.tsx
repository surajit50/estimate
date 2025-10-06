"use client"
import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Download } from "lucide-react"
import { DeleteAbstractBillDialog } from "./delete-abstract-bill-dialog"

interface AbstractBill {
  id: string
  billNo: string
  billDate: Date | string
  periodFrom: Date | string
  periodTo: Date | string
  contractor?: string | null
  engineer?: string | null
  status: string
  submittedAt?: Date | string | null
  approvedAt?: Date | string | null
  paidAt?: Date | string | null
  totalAmount: number
  createdAt: Date | string
  updatedAt: Date | string
  measurementBook: {
    id: string
    title: string
    estimate: {
      id: string
      title: string
      category: string
    }
  }
  items: any[]
}

interface AbstractBillsTableProps {
  abstractBills: AbstractBill[]
  onDelete?: (id: string) => void
}

export function AbstractBillsTable({ abstractBills, onDelete }: AbstractBillsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAbstractBill, setSelectedAbstractBill] = useState<AbstractBill | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const handleDeleteClick = (abstractBill: AbstractBill) => {
    setSelectedAbstractBill(abstractBill)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedAbstractBill && onDelete) {
      onDelete(selectedAbstractBill.id)
    }
    setDeleteDialogOpen(false)
    setSelectedAbstractBill(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (abstractBills.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No abstract bills found</h3>
              <p className="text-muted-foreground">
                Create abstract bills to summarize work completed and generate payment requests.
              </p>
            </div>
            <Link href="/abstract-bills/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Abstract Bill
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Abstract Bills
            <Link href="/abstract-bills/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Abstract Bill
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Measurement Book</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abstractBills.map((abstractBill) => (
                  <TableRow key={abstractBill.id}>
                    <TableCell className="font-medium">{abstractBill.billNo}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{abstractBill.measurementBook.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {abstractBill.measurementBook.estimate.title}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(abstractBill.periodFrom), "MMM dd")} - {format(new Date(abstractBill.periodTo), "MMM dd, yyyy")}</div>
                        <div className="text-muted-foreground">
                          Bill Date: {format(new Date(abstractBill.billDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(abstractBill.status)}>
                        {abstractBill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{abstractBill.items.length}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(abstractBill.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(abstractBill.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/abstract-bills/${abstractBill.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/abstract-bills/${abstractBill.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/abstract-bills/${abstractBill.id}/download`}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(abstractBill)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteAbstractBillDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        abstractBill={selectedAbstractBill}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
