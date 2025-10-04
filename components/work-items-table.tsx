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

import type { WorkItemWithUnit, UnitMasterType, RateLibraryType, SubWorkItemType } from "@/lib/types"

interface WorkItemsTableProps {
  estimateId: string
  workItems: WorkItemWithUnit[]
  units: UnitMasterType[]
  rates: RateLibraryType[]
  onAdd: (item: WorkItemWithUnit) => void
  onUpdate: (item: WorkItemWithUnit) => void
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
  const [editItem, setEditItem] = useState<WorkItemWithUnit | null>(null)
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
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Work Items</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {workItems.length} item{workItems.length !== 1 ? 's' : ''} in this estimate
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} size="default" className="group">
              <PlusCircle className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
              Add Work Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <PlusCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No work items yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your estimate by adding work items. Each item represents a specific construction task or material.
              </p>
              <Button onClick={() => setAddDialogOpen(true)} size="lg" className="group">
                <PlusCircle className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                Add Your First Work Item
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
                    const hasSubItems = (item.subItems && item.subItems.length > 0) || (item.subCategories && item.subCategories.length > 0)
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
                            {item.pageRef && (
                              <Badge variant="outline" className="text-xs">
                                {item.pageRef}
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

                        {isExpanded && (
                          <>
                            {/* Direct Sub-items */}
                            {item.subItems && item.subItems.length > 0 && item.subItems.map((subItem, idx) => (
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

                            {/* Sub-categories and their sub-items */}
                            {item.subCategories && item.subCategories.length > 0 && item.subCategories.map((subCategory, categoryIdx) => (
                              <React.Fragment key={subCategory.id}>
                                {/* Sub-category header */}
                                <TableRow className="bg-blue-50/50 text-sm font-medium">
                                  <TableCell></TableCell>
                                  <TableCell></TableCell>
                                  <TableCell></TableCell>
                                  <TableCell className="pl-6 text-blue-700 font-semibold">
                                    {subCategory.categoryName}
                                    {subCategory.description && (
                                      <span className="text-blue-600 text-xs block font-normal">
                                        {subCategory.description}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell colSpan={8}></TableCell>
                                </TableRow>

                                {/* Sub-items within this category */}
                                {subCategory.subItems && subCategory.subItems.map((subItem, subItemIdx) => (
                                  <TableRow key={subItem.id} className="bg-muted/20 text-sm">
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="pl-12 text-muted-foreground italic">
                                      {subItem.description}
                                    </TableCell>
                                    <TableCell className="text-right">{subItem.nos}</TableCell>
                                    <TableCell className="text-right">{subItem.length.toFixed(3)}</TableCell>
                                    <TableCell className="text-right">{subItem.breadth.toFixed(3)}</TableCell>
                                    <TableCell className="text-right">{subItem.depth.toFixed(3)}</TableCell>
                                    <TableCell className="text-right">{subItem.quantity.toFixed(2)}</TableCell>
                                    <TableCell colSpan={4}></TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                          </>
                        )}
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
