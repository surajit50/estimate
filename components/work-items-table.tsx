"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Check, X, Save } from "lucide-react"
import AddWorkItemDialog from "@/components/add-work-item-dialog"
import { updateWorkItem, deleteWorkItem } from "@/lib/actions/work-items"
import type { WorkItemWithUnit, UnitMasterType, RateLibraryType, SubCategoryType, SubWorkItemType } from "@/lib/types"

interface WorkItemHeading {
  id: string
  title: string
  position: number
}

interface WorkItemWithHeading extends WorkItemWithUnit {
  headingId?: string
}

interface WorkItemsTableProps {
  estimateId: string
  workItems: WorkItemWithUnit[]
  units: UnitMasterType[]
  rates: RateLibraryType[]
  onAdd: (item: WorkItemWithUnit) => void
  onUpdate: (item: WorkItemWithUnit) => void
  onDelete: (id: string) => void
  onAddHeading?: (heading: WorkItemHeading) => void
  onUpdateHeading?: (heading: WorkItemHeading) => void
  onDeleteHeading?: (id: string) => void
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v)
}

function unitSymbolForItem(wi: WorkItemWithUnit, units: UnitMasterType[]) {
  return wi.unit?.unitSymbol ?? units.find((u) => u.id === wi.unitId)?.unitSymbol ?? ""
}

function qtyFromSubItems(subItems?: SubWorkItemType[]) {
  return (subItems ?? []).reduce((acc, s) => acc + (isNumber(s.quantity) ? s.quantity : 0), 0)
}

function qtyFromSubCategories(subCategories?: SubCategoryType[]) {
  return (subCategories ?? []).reduce((acc, c) => acc + qtyFromSubItems(c.subItems), 0)
}

function deriveQuantity(wi: WorkItemWithUnit): number {
  // For simplified work items, just use the quantity directly
  return isNumber(wi.quantity) ? wi.quantity : 0
}

function deriveAmount(wi: WorkItemWithUnit, qty: number): number {
  // For simplified work items, just use the amount directly or calculate from quantity * rate
  if (isNumber(wi.amount)) return wi.amount
  const rate = isNumber(wi.rate) ? wi.rate : 0
  return qty * rate
}

export function WorkItemsTable({ estimateId, workItems, units, rates, onAdd, onUpdate, onDelete, onAddHeading, onUpdateHeading, onDeleteHeading }: WorkItemsTableProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [bulkRate, setBulkRate] = React.useState("")
  const [bulkDescription, setBulkDescription] = React.useState("")
  const [headings, setHeadings] = React.useState<WorkItemHeading[]>([])
  const [editingQuantity, setEditingQuantity] = React.useState<string | null>(null)
  const [quantityValue, setQuantityValue] = React.useState("")
  const [headingDialogOpen, setHeadingDialogOpen] = React.useState(false)
  const [newHeadingTitle, setNewHeadingTitle] = React.useState("")

  const nextItemNo = React.useMemo(() => {
    const maxNo = workItems.reduce((m, wi) => Math.max(m, wi.itemNo ?? 0), 0)
    return maxNo + 1
  }, [workItems])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(workItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkUpdate = async () => {
    try {
      const updates = Array.from(selectedItems).map(async itemId => {
        const item = workItems.find(wi => wi.id === itemId)
        if (!item) return null

        const updateData: any = {}
        if (bulkDescription.trim()) {
          updateData.description = bulkDescription.trim()
        }

        if (Object.keys(updateData).length > 0) {
          const result = await updateWorkItem(itemId, updateData)
          if (result.success && result.data) {
            onUpdate(result.data)
          }
        }
        return item
      })

      const results = await Promise.all(updates)
      const validItems = results.filter((item) => item !== null) as WorkItemWithUnit[]
      
      setSelectedItems(new Set())
      setBulkEditOpen(false)
      setBulkRate("")
      setBulkDescription("")
    } catch (error) {
      console.error("Error updating work items:", error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedItems).map(async itemId => {
        const result = await deleteWorkItem(itemId)
        if (result.success) {
          onDelete(itemId)
        }
      })
      
      await Promise.all(deletePromises)
      setSelectedItems(new Set())
    } catch (error) {
      console.error("Error deleting work items:", error)
    }
  }

  const handleQuantityEdit = (itemId: string, currentQuantity: number) => {
    setEditingQuantity(itemId)
    setQuantityValue(currentQuantity.toString())
  }

  const handleQuantitySave = async (itemId: string) => {
    try {
      const newQuantity = parseFloat(quantityValue)
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        const item = workItems.find(wi => wi.id === itemId)
        if (item) {
          const updateData = {
            quantity: newQuantity,
            amount: deriveAmount({ ...item, quantity: newQuantity }, newQuantity)
          }
          const result = await updateWorkItem(itemId, updateData)
          if (result.success && result.data) {
            onUpdate(result.data)
          }
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setEditingQuantity(null)
      setQuantityValue("")
    }
  }

  const handleQuantityCancel = () => {
    setEditingQuantity(null)
    setQuantityValue("")
  }

  const handleAddHeading = () => {
    if (newHeadingTitle.trim()) {
      const newHeading: WorkItemHeading = {
        id: `heading-${Date.now()}`,
        title: newHeadingTitle.trim(),
        position: headings.length
      }
      setHeadings(prev => [...prev, newHeading])
      onAddHeading?.(newHeading)
      setNewHeadingTitle("")
      setHeadingDialogOpen(false)
    }
  }

  const isAllSelected = workItems.length > 0 && selectedItems.size === workItems.length
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < workItems.length

  // Set indeterminate state for select all checkbox
  React.useEffect(() => {
    const checkbox = document.querySelector('input[type="checkbox"][data-select-all]') as HTMLInputElement
    if (checkbox) {
      checkbox.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  return (
    <div className="bg-white border rounded-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Work Items</h3>
          <p className="text-sm text-muted-foreground">Manage items, quantities, and amounts</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Selected ({selectedItems.size})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Edit Selected Items</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-description">Description</Label>
                      <Input
                        id="bulk-description"
                        placeholder="Enter new description"
                        value={bulkDescription}
                        onChange={(e) => setBulkDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleBulkUpdate}>
                        <Check className="h-4 w-4 mr-2" />
                        Apply Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
          <Dialog open={headingDialogOpen} onOpenChange={setHeadingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Heading
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Work Item Heading</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="heading-title">Heading Title</Label>
                  <Input
                    id="heading-title"
                    placeholder="e.g., Earth Work, Plaster, etc."
                    value={newHeadingTitle}
                    onChange={(e) => setNewHeadingTitle(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setHeadingDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddHeading}>
                    <Check className="h-4 w-4 mr-2" />
                    Add Heading
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Work Item
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  data-select-all
                />
              </TableHead>
              <TableHead className="w-[90px]">Item No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Unit</TableHead>
              <TableHead className="w-[140px] text-right">Quantity</TableHead>
              <TableHead className="w-[120px] text-right">Rate (₹)</TableHead>
              <TableHead className="w-[160px] text-right">Amount (₹)</TableHead>
              <TableHead className="w-[90px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No work items yet. Click "Add Work Item" to create one.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Render headings and their items */}
                {headings.map((heading) => (
                  <React.Fragment key={heading.id}>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="font-semibold text-lg py-4">
                        <div className="flex items-center justify-between">
                          <span>{heading.title}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newTitle = prompt("Edit heading:", heading.title)
                                if (newTitle && newTitle.trim()) {
                                  const updatedHeading = { ...heading, title: newTitle.trim() }
                                  setHeadings(prev => prev.map(h => h.id === heading.id ? updatedHeading : h))
                                  onUpdateHeading?.(updatedHeading)
                                }
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setHeadings(prev => prev.filter(h => h.id !== heading.id))
                                onDeleteHeading?.(heading.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    {workItems
                      .filter(wi => (wi as any).headingId === heading.id)
                      .map((wi) => {
                        const symbol = unitSymbolForItem(wi, units)
                        const displayQty = deriveQuantity(wi)
                        const displayAmount = deriveAmount(wi, displayQty)
                        const isSelected = selectedItems.has(wi.id)

                        return (
                          <TableRow key={wi.id} className={isSelected ? "bg-muted/50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectItem(wi.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>{wi.itemNo}</TableCell>
                            <TableCell className="max-w-[520px]">
                              <div className="font-medium">{wi.description}</div>
                              {wi.pageRef ? <div className="text-xs text-muted-foreground mt-1">Ref: {wi.pageRef}</div> : null}
                            </TableCell>
                            <TableCell>{symbol}</TableCell>
                            <TableCell className="text-right">
                              {editingQuantity === wi.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    step="0.001"
                                    value={quantityValue}
                                    onChange={(e) => setQuantityValue(e.target.value)}
                                    className="w-20 h-8"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuantitySave(wi.id)
                                      if (e.key === 'Escape') handleQuantityCancel()
                                    }}
                                  />
                                  <Button size="sm" variant="ghost" onClick={() => handleQuantitySave(wi.id)}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleQuantityCancel}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div 
                                  className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                                  onClick={() => handleQuantityEdit(wi.id, displayQty)}
                                >
                                  {displayQty.toFixed(3)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right bg-muted/20">
                              <span className="text-muted-foreground">
                                {(wi.rate ?? 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {displayAmount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete item ${wi.itemNo}`}
                                onClick={async () => {
                                  const result = await deleteWorkItem(wi.id)
                                  if (result.success) {
                                    onDelete(wi.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </React.Fragment>
                ))}
                
                {/* Render items without headings */}
                {workItems
                  .filter(wi => !(wi as any).headingId)
                  .map((wi) => {
                    const symbol = unitSymbolForItem(wi, units)
                    const displayQty = deriveQuantity(wi)
                    const displayAmount = deriveAmount(wi, displayQty)
                    const isSelected = selectedItems.has(wi.id)

                    return (
                      <TableRow key={wi.id} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectItem(wi.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>{wi.itemNo}</TableCell>
                        <TableCell className="max-w-[520px]">
                          <div className="font-medium">{wi.description}</div>
                          {wi.pageRef ? <div className="text-xs text-muted-foreground mt-1">Ref: {wi.pageRef}</div> : null}
                        </TableCell>
                        <TableCell>{symbol}</TableCell>
                        <TableCell className="text-right">
                          {editingQuantity === wi.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.001"
                                value={quantityValue}
                                onChange={(e) => setQuantityValue(e.target.value)}
                                className="w-20 h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuantitySave(wi.id)
                                  if (e.key === 'Escape') handleQuantityCancel()
                                }}
                              />
                              <Button size="sm" variant="ghost" onClick={() => handleQuantitySave(wi.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleQuantityCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                              onClick={() => handleQuantityEdit(wi.id, displayQty)}
                            >
                              {displayQty.toFixed(3)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right bg-muted/20">
                          <span className="text-muted-foreground">
                            {(wi.rate ?? 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {displayAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete item ${wi.itemNo}`}
                            onClick={async () => {
                              const result = await deleteWorkItem(wi.id)
                              if (result.success) {
                                onDelete(wi.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <AddWorkItemDialog
        open={open}
        onOpenChange={setOpen}
        onAdd={(newItem: any) => {
          onAdd(newItem)
        }}
        estimateId={estimateId}
        units={units}
        rates={rates}
        nextItemNo={nextItemNo}
      />
    </div>
  )
}
