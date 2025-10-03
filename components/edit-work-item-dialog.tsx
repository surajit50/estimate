"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

import type { WorkItemWithUnit, SubWorkItemType, UnitMasterType, RateLibraryType } from "@/lib/types"

type Unit = UnitMasterType
type Rate = RateLibraryType

interface EditWorkItemDialogProps {
  item: WorkItemWithUnit | null
  onOpenChange: (open: boolean) => void
  onEdit: (item: any) => void
  units: Unit[]
  rates: Rate[]
}

export function EditWorkItemDialog({ item, onOpenChange, onEdit, units, rates }: EditWorkItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pageRef: "",
    itemRef: "",
    description: "",
    unitId: "",
    rate: "",
    length: "",
    width: "",
    height: "",
  })
  const [subItems, setSubItems] = useState<SubWorkItemType[]>([])
  const [calculatedQuantity, setCalculatedQuantity] = useState(0)
  const [calculatedAmount, setCalculatedAmount] = useState(0)

  useEffect(() => {
    if (item) {
      setFormData({
        pageRef: item.pageRef || "",
        itemRef: item.itemRef || "",
        description: item.description,
        unitId: item.unitId,
        rate: item.rate.toString(),
        length: item.length.toString(),
        width: item.width.toString(),
        height: item.height.toString(),
      })
      setSubItems(item.subItems || [])
    }
  }, [item])

  useEffect(() => {
    let quantity = 0

    if (subItems.length > 0) {
      quantity = subItems.reduce((sum, item) => {
        return sum + item.nos * item.length * item.breadth * item.depth
      }, 0)
    } else {
      const length = Number.parseFloat(formData.length) || 0
      const width = Number.parseFloat(formData.width) || 0
      const height = Number.parseFloat(formData.height) || 0
      quantity = length * width * height
    }

    const rate = Number.parseFloat(formData.rate) || 0
    const amount = quantity * rate

    setCalculatedQuantity(quantity)
    setCalculatedAmount(amount)
  }, [formData.length, formData.width, formData.height, formData.rate, subItems])

  const addSubItem = () => {
    setSubItems([...subItems, { description: "", nos: 1, length: 1, breadth: 1, depth: 1, quantity: 1 }])
  }

  const removeSubItem = (index: number) => {
    setSubItems(subItems.filter((_, i) => i !== index))
  }

  const updateSubItem = (index: number, field: keyof SubWorkItemType, value: string | number) => {
    const updated = [...subItems]
    updated[index] = { ...updated[index], [field]: value }

    // Recalculate quantity for this sub-item
    const sub = updated[index]
    updated[index].quantity = sub.nos * sub.length * sub.breadth * sub.depth

    setSubItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setLoading(true)

    try {
      const selectedUnit = units.find((u) => u.id === formData.unitId)

      // Parse page/item reference
      const pageItemParts = formData.pageRef.split("/")
      const pageRef = pageItemParts[0] || null
      const itemRef = pageItemParts[1] || null

      const response = await fetch(`/api/work-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageRef,
          itemRef,
          description: formData.description,
          unitId: formData.unitId,
          rate: Number.parseFloat(formData.rate),
          length: Number.parseFloat(formData.length),
          width: Number.parseFloat(formData.width),
          height: Number.parseFloat(formData.height),
          quantity: calculatedQuantity,
          amount: calculatedAmount,
          subItems: subItems.map((item) => ({
            id: item.id,
            description: item.description,
            nos: item.nos,
            length: item.length,
            breadth: item.breadth,
            depth: item.depth,
            quantity: item.quantity,
            unitSymbol: selectedUnit?.unitSymbol || "",
          })),
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        onEdit(updatedItem)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error updating work item:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Work Item</DialogTitle>
          <DialogDescription>Update the work item details with automatic recalculation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pageRef">Page & Item Reference</Label>
                <Input
                  id="edit-pageRef"
                  value={formData.pageRef}
                  onChange={(e) => setFormData({ ...formData, pageRef: e.target.value })}
                  placeholder="e.g., 1/2 a, 332/18.07"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unitId">Unit *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  required
                >
                  <SelectTrigger id="edit-unitId">
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

            <div className="space-y-2">
              <Label htmlFor="edit-description">Item Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter work item description"
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rate">Rate (₹) *</Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="Enter rate"
                required
              />
            </div>

            {/* Sub-items section */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-base">Sub-Items (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSubItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sub-Item
                </Button>
              </div>

              {subItems.length > 0 ? (
                <div className="space-y-3">
                  {subItems.map((item, index) => (
                    <div key={index} className="p-3 bg-background rounded border space-y-3">
                      <div className="flex items-start gap-2">
                        <Input
                          placeholder="Sub-item description"
                          value={item.description}
                          onChange={(e) => updateSubItem(index, "description", e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSubItem(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Nos"
                          value={item.nos}
                          onChange={(e) => updateSubItem(index, "nos", Number.parseFloat(e.target.value))}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Length"
                          value={item.length}
                          onChange={(e) => updateSubItem(index, "length", Number.parseFloat(e.target.value))}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Breadth"
                          value={item.breadth}
                          onChange={(e) => updateSubItem(index, "breadth", Number.parseFloat(e.target.value))}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Depth"
                          value={item.depth}
                          onChange={(e) => updateSubItem(index, "depth", Number.parseFloat(e.target.value))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity.toFixed(3)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-length">Length *</Label>
                    <Input
                      id="edit-length"
                      type="number"
                      step="0.01"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-width">Width *</Label>
                    <Input
                      id="edit-width"
                      type="number"
                      step="0.01"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-height">Height/Depth *</Label>
                    <Input
                      id="edit-height"
                      type="number"
                      step="0.01"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-lg font-bold">{calculatedQuantity.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">
                  ₹{calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Work Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
