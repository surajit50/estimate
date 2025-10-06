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
import { MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react"
import { DeleteMeasurementBookDialog } from "./delete-measurement-book-dialog"

interface MeasurementBook {
  id: string
  title: string
  description?: string | null
  location?: string | null
  contractor?: string | null
  engineer?: string | null
  status: string
  submittedAt?: Date | string | null
  approvedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  estimate: {
    id: string
    title: string
    category: string
  }
  entries: any[]
  abstractBills: any[]
}

interface MeasurementBooksTableProps {
  measurementBooks: MeasurementBook[]
  onDelete?: (id: string) => void
}

export function MeasurementBooksTable({ measurementBooks, onDelete }: MeasurementBooksTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMeasurementBook, setSelectedMeasurementBook] = useState<MeasurementBook | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const handleDeleteClick = (measurementBook: MeasurementBook) => {
    setSelectedMeasurementBook(measurementBook)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedMeasurementBook && onDelete) {
      onDelete(selectedMeasurementBook.id)
    }
    setDeleteDialogOpen(false)
    setSelectedMeasurementBook(null)
  }

  if (measurementBooks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No measurement books found</h3>
              <p className="text-muted-foreground">
                Create your first measurement book to start tracking measurements and generating bills.
              </p>
            </div>
            <Link href="/measurement-books/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Measurement Book
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
            Measurement Books
            <Link href="/measurement-books/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Measurement Book
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Estimate</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurementBooks.map((measurementBook) => (
                  <TableRow key={measurementBook.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{measurementBook.title}</div>
                        {measurementBook.description && (
                          <div className="text-sm text-muted-foreground">
                            {measurementBook.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{measurementBook.estimate.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {measurementBook.estimate.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{measurementBook.location || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(measurementBook.status)}>
                        {measurementBook.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{measurementBook.entries.length}</TableCell>
                    <TableCell>
                      {format(new Date(measurementBook.createdAt), "MMM dd, yyyy")}
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
                            <Link href={`/measurement-books/${measurementBook.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/measurement-books/${measurementBook.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(measurementBook)}
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

      <DeleteMeasurementBookDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        measurementBook={selectedMeasurementBook}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
