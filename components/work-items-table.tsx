"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { AddWorkItemDialog } from "@/components/add-work-item-dialog"
import { EditWorkItemDialog } from "@/components/edit-work-item-dialog"
import { DeleteWorkItemDialog } from "@/components/delete-work-item-dialog"
import { Badge } from "@/components/ui/badge"

interface SubItem {
  id: string
  description: string
  nos: number
  length: number
  breadth: number
  depth: number
  quantity: number
}

interface WorkItem {
  id: string
  itemNo: number
  pageRef: string | null
  itemRef: string | null
  description: string
  unitId: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  rate: number
  length: number
  width: number
  height: number
  quantity: number
  amount: number
  subItems?: SubItem[]
}

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface Rate {
  id: string
  description: string
  unitId: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  standardRate: number
  year: string | null
}

interface WorkItemsTableProps {
  estimateId: string
  workItems: WorkItem[]
  units: Unit[]
  rates: Rate[]
  onAdd: (item: WorkItem) => void
  onUpdate: (item: WorkItem) => void
  onDelete: (id: string) => void
}

export function WorkItemsTable({
  estimateId,
  workItems,
  units,
  rates,
  onAdd,
  onUpdate,
  onDelete,
}: WorkItemsTableProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<WorkItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/work-items/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      onDelete(id)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Work Items</CardTitle>
            <Button onClick={() => setAddDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Work Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No work items added yet. Add your first work item to get started.</p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                Add Work Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16">S.No.</TableHead>
                    <TableHead className="w-24">Page/Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Nos.</TableHead>
                    <TableHead className="w-20">Length (M)</TableHead>
                    <TableHead className="w-20">Breadth (M)</TableHead>
                    <TableHead className="w-20">Depth (M)</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-16">Unit</TableHead>
                    <TableHead className="text-right w-24">Rate (₹)</TableHead>
                    <TableHead className="text-right w-32">Amount (₹)</TableHead>
                    <TableHead className="text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workItems.map((item) => {
                    const hasSubItems = item.subItems && item.subItems.length > 0
                    const isExpanded = expandedItems.has(item.id)

                    return (
                      <>
                        <TableRow key={item.id} className="font-medium">
                          <TableCell>
                            {hasSubItems && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(item.id)}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-bold">{item.itemNo}</TableCell>
                          <TableCell>
                            {item.pageRef && item.itemRef && (
                              <Badge variant="outline" className="text-xs">
                                {item.pageRef}/{item.itemRef}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="line-clamp-2">{item.description}</div>
                          </TableCell>
                          <TableCell className="text-right">1</TableCell>
                          <TableCell className="text-right">{item.length.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{item.width.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{item.height.toFixed(3)}</TableCell>
                          <TableCell className="text-right font-bold">{item.quantity.toFixed(2)}</TableCell>
                          <TableCell>{item.unit.unitSymbol}</TableCell>
                          <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">
                            {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditItem(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {hasSubItems &&
                          isExpanded &&
                          item.subItems!.map((subItem, idx) => (
                            <TableRow key={subItem.id} className="bg-muted/30 text-sm">
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="pl-8 text-muted-foreground italic">{subItem.description}</TableCell>
                              <TableCell className="text-right">{subItem.nos}</TableCell>
                              <TableCell className="text-right">{subItem.length.toFixed(3)}</TableCell>
                              <TableCell className="text-right">{subItem.breadth.toFixed(3)}</TableCell>
                              <TableCell className="text-right">{subItem.depth.toFixed(3)}</TableCell>
                              <TableCell className="text-right">{subItem.quantity.toFixed(2)}</TableCell>
                              <TableCell colSpan={4}></TableCell>
                            </TableRow>
                          ))}
                      </>
                    )
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={11} className="text-right text-lg">
                      Sub Total:
                    </TableCell>
                    <TableCell className="text-right text-lg">
                      ₹
                      {workItems
                        .reduce((sum, item) => sum + item.amount, 0)
                        .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddWorkItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={onAdd}
        estimateId={estimateId}
        units={units}
        rates={rates}
        nextItemNo={workItems.length + 1}
      />
      <EditWorkItemDialog
        item={editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onEdit={onUpdate}
        units={units}
        rates={rates}
      />
      <DeleteWorkItemDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </>
  )
}
