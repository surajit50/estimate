"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createWorkItem } from "@/lib/actions/work-items"

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface Rate {
  id: string
  description: string
  unitId: string
  standardRate: number
}

interface WorkItemForm {
  id: string
  pageRef: string
  description: string
  unitId: string
  rate: number
  quantity: number
  length: number
  width: number
  height: number
}

interface BulkAddWorkItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (items: any[]) => void
  estimateId: string
  units: Unit[]
  rates: Rate[]
  nextItemNo: number
}

export default function BulkAddWorkItemsDialog({
  open,
  onOpenChange,
  onAdd,
  estimateId,
  units,
  rates,
  nextItemNo,
}: BulkAddWorkItemsDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [workItems, setWorkItems] = React.useState<WorkItemForm[]>([
    {
      id: "1",
      pageRef: "",
      description: "",
      unitId: "",
      rate: 0,
      quantity: 0,
    }
  ])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
    setWorkItems([
      {
        id: "1",
        pageRef: "",
        description: "",
        unitId: "",
        rate: 0,
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
      }
    ])
      setError(null)
      setIsSubmitting(false)
    }
  }, [open])

  const addWorkItem = () => {
    const newId = (workItems.length + 1).toString()
    setWorkItems([
      ...workItems,
      {
        id: newId,
        pageRef: "",
        description: "",
        unitId: "",
        rate: 0,
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
      }
    ])
  }

  const removeWorkItem = (id: string) => {
    if (workItems.length > 1) {
      setWorkItems(workItems.filter(item => item.id !== id))
    }
  }

  const updateWorkItem = (id: string, field: keyof WorkItemForm, value: any) => {
    setWorkItems(workItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Rate selection handler
  const handleRateSelect = (itemId: string, rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId)
    if (selectedRate) {
      updateWorkItem(itemId, "description", selectedRate.description)
      updateWorkItem(itemId, "unitId", selectedRate.unitId)
      updateWorkItem(itemId, "rate", Number(selectedRate.standardRate))
    }
  }

  // Submit handler
  const onSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const validItems = workItems.filter(item => 
        item.description.trim() && item.unitId && item.rate > 0 && item.quantity > 0
      )

      if (validItems.length === 0) {
        throw new Error("Please fill in at least one valid work item")
      }

      const createdItems = []
      let currentItemNo = nextItemNo

      for (const item of validItems) {
        const amount = item.quantity * item.rate

        const payload = {
          estimateId,
          itemNo: currentItemNo,
          pageRef: item.pageRef || null,
          description: item.description,
          unitId: item.unitId,
          rate: item.rate,
          quantity: item.quantity,
          amount: amount,
          length: item.length || null,
          width: item.width || null,
          height: item.height || null,
          subItems: [],
          subCategories: [],
        }

        const result = await createWorkItem(payload)

        if (!result.success) {
          throw new Error(result.error || "Failed to create work item")
        }

        createdItems.push(result.data)
        currentItemNo++
      }

      onAdd(createdItems)
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding work items:", error)
      setError(error instanceof Error ? error.message : "Failed to create work items")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Add Work Items</DialogTitle>
          <DialogDescription>
            Add multiple work items quickly. Each row represents one work item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {workItems.length} item{workItems.length !== 1 ? 's' : ''} to add
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addWorkItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {workItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Item {index + 1}</h4>
                    <div className="flex items-center gap-2">
                      {workItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Description *</label>
                      <Input
                        placeholder="Work item description"
                        value={item.description}
                        onChange={(e) => updateWorkItem(item.id, "description", e.target.value)}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Unit *</label>
                      <Select
                        value={item.unitId}
                        onValueChange={(value) => updateWorkItem(item.id, "unitId", value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unitSymbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Rate (₹) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.rate || ""}
                        onChange={(e) => updateWorkItem(item.id, "rate", Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.quantity || ""}
                        onChange={(e) => updateWorkItem(item.id, "quantity", Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Page Ref</label>
                      <Input
                        placeholder="e.g., 1/2 a"
                        value={item.pageRef}
                        onChange={(e) => updateWorkItem(item.id, "pageRef", e.target.value)}
                        className="h-8"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="text-xs text-muted-foreground">
                        Amount: <span className="font-medium text-foreground">
                          ₹{((item.rate || 0) * (item.quantity || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dimensions for m2 and m3 units */}
                  <div className="mt-3">
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Dimensions (for m² and m³ units)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Length (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.length || ""}
                          onChange={(e) => updateWorkItem(item.id, "length", Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Width (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.width || ""}
                          onChange={(e) => updateWorkItem(item.id, "width", Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Height (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.height || ""}
                          onChange={(e) => updateWorkItem(item.id, "height", Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Rate Selection */}
                  {rates.length > 0 && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Select</label>
                      <div className="flex flex-wrap gap-1">
                        {rates.slice(0, 5).map((rate) => (
                          <Button
                            key={rate.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleRateSelect(item.id, rate.id)}
                          >
                            {rate.description.length > 20 
                              ? `${rate.description.substring(0, 20)}...` 
                              : rate.description
                            } - ₹{rate.standardRate}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? "Adding..." : `Add ${workItems.length} Item${workItems.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
