"use client"
import { useState } from "react"
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
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { DeleteMeasurementEntryDialog } from "./delete-measurement-entry-dialog"
import { AddMeasurementEntryDialog } from "./add-measurement-entry-dialog"

interface MeasurementEntry {
  id: string
  entryDate: Date | string
  pageNo: string
  itemNo: string
  description: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  length: number
  width: number
  height: number
  quantity: number
  remarks?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

interface MeasurementEntriesTableProps {
  measurementBookId: string
  entries: MeasurementEntry[]
  onDelete?: (id: string) => void
}

export function MeasurementEntriesTable({ 
  measurementBookId, 
  entries, 
  onDelete 
}: MeasurementEntriesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<MeasurementEntry | null>(null)

  const handleDeleteClick = (entry: MeasurementEntry) => {
    setSelectedEntry(entry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedEntry && onDelete) {
      onDelete(selectedEntry.id)
    }
    setDeleteDialogOpen(false)
    setSelectedEntry(null)
  }

  const formatDimensions = (length: number, width: number, height: number) => {
    const dims = []
    if (length > 0) dims.push(`${length}m`)
    if (width > 0) dims.push(`${width}m`)
    if (height > 0) dims.push(`${height}m`)
    return dims.length > 0 ? dims.join(" × ") : "-"
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No measurement entries found</h3>
              <p className="text-muted-foreground">
                Add measurement entries to track work progress and generate bills.
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
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
            Measurement Entries
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Item No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(new Date(entry.entryDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{entry.pageNo}</TableCell>
                    <TableCell>{entry.itemNo}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell>
                      {formatDimensions(entry.length, entry.width, entry.height)}
                    </TableCell>
                    <TableCell className="font-medium">{entry.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {entry.unit.unitSymbol}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.remarks || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(entry)}
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

      <DeleteMeasurementEntryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entry={selectedEntry}
        onConfirm={handleDeleteConfirm}
      />

      <div>{addDialogOpen && (
        <AddMeasurementEntryDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          measurementBookId={measurementBookId}
          onSuccess={() => {
            // Refresh the page or refetch data
            window.location.reload()
          }}
        />
      )}</div>
      
    </>
  )
}
