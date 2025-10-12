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
  length?: number
  width?: number
  height?: number
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Add Work Items</DialogTitle>
          <DialogDescription>
            Add multiple work items at once. Fill in the details for each item below.
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

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {workItems.map((item, index) => (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Item {index + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Page Reference</label>
                        <Input
                          placeholder="e.g., 1/2 a"
                          value={item.pageRef}
                          onChange={(e) => updateWorkItem(item.id, "pageRef", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Unit *</label>
                        <Select
                          value={item.unitId}
                          onValueChange={(value) => updateWorkItem(item.id, "unitId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitName} ({unit.unitSymbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Description *</label>
                      <Textarea
                        rows={2}
                        placeholder="Enter work item description"
                        value={item.description}
                        onChange={(e) => updateWorkItem(item.id, "description", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Rate (₹) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter rate"
                          value={item.rate || ""}
                          onChange={(e) => updateWorkItem(item.id, "rate", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quantity *</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter quantity"
                          value={item.quantity || ""}
                          onChange={(e) => updateWorkItem(item.id, "quantity", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Amount (₹)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={((item.rate || 0) * (item.quantity || 0)).toFixed(2)}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    {/* Rate Library Quick Select */}
                    {rates.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quick Select from Rate Library</label>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {rates.map((rate) => (
                            <Button
                              key={rate.id}
                              type="button"
                              variant="outline"
                              className="justify-between text-left h-auto p-2 text-xs"
                              onClick={() => handleRateSelect(item.id, rate.id)}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{rate.description}</div>
                                <div className="text-muted-foreground">
                                  {units.find(u => u.id === rate.unitId)?.unitSymbol}
                                </div>
                              </div>
                              <div className="text-xs font-medium">₹{rate.standardRate}</div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
