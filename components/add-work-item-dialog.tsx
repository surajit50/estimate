"use client"

import type React from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
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

interface SubItem {
  description: string
  nos: string
  length: string
  breadth: string
  depth: string
}

interface AddWorkItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: any) => void
  estimateId: string
  units: Unit[]
  rates: Rate[]
  nextItemNo: number
}

const cardStyle = "bg-white shadow-sm rounded-lg p-6 border border-gray-200"
const sectionTitleStyle = "text-lg font-semibold text-gray-900 mb-4"
const gridContainerStyle = "grid grid-cols-1 md:grid-cols-2 gap-6"

export function AddWorkItemDialog({
  open,
  onOpenChange,
  onAdd,
  estimateId,
  units,
  rates,
  nextItemNo,
}: AddWorkItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pageRef: "",
    description: "",
    unitId: "",
    rate: "",
    length: "1",
    width: "1",
    height: "1",
  })
  const [subItems, setSubItems] = useState<SubItem[]>([])
  const [calculatedQuantity, setCalculatedQuantity] = useState(1)
  const [calculatedAmount, setCalculatedAmount] = useState(0)

  // Calculate quantity and amount whenever dimensions or rate change
  useEffect(() => {
    let quantity = 0

    if (subItems.length > 0) {
      // Calculate from sub-items
      quantity = subItems.reduce((sum, item) => {
        const nos = Number.parseFloat(item.nos) || 0
        const length = Number.parseFloat(item.length) || 0
        const breadth = Number.parseFloat(item.breadth) || 0
        const depth = Number.parseFloat(item.depth) || 0
        return sum + nos * length * breadth * depth
      }, 0)
    } else {
      // Calculate from main dimensions
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

  const handleRateSelect = (rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId)
    if (selectedRate) {
      setFormData({
        ...formData,
        description: selectedRate.description,
        unitId: selectedRate.unitId,
        rate: selectedRate.standardRate.toString(),
      })
    }
  }

  const addSubItem = () => {
    setSubItems([...subItems, { description: "", nos: "1", length: "1", breadth: "1", depth: "1" }])
  }

  const removeSubItem = (index: number) => {
    setSubItems(subItems.filter((_, i) => i !== index))
  }

  const updateSubItem = (index: number, field: keyof SubItem, value: string) => {
    const updated = [...subItems]
    updated[index][field] = value
    setSubItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedUnit = units.find((u) => u.id === formData.unitId)

      const response = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          itemNo: nextItemNo,
          pageRef: formData.pageRef || null,
          description: formData.description,
          unitId: formData.unitId,
          rate: Number.parseFloat(formData.rate),
          length: Number.parseFloat(formData.length),
          width: Number.parseFloat(formData.width),
          height: Number.parseFloat(formData.height),
          quantity: calculatedQuantity,
          amount: calculatedAmount,
          subItems: subItems.map((item) => ({
            description: item.description,
            nos: Number.parseFloat(item.nos),
            length: Number.parseFloat(item.length),
            breadth: Number.parseFloat(item.breadth),
            depth: Number.parseFloat(item.depth),
            quantity:
              Number.parseFloat(item.nos) *
              Number.parseFloat(item.length) *
              Number.parseFloat(item.breadth) *
              Number.parseFloat(item.depth),
            unitSymbol: selectedUnit?.unitSymbol || "",
          })),
        }),
      })

      if (response.ok) {
        const newItem = await response.json()
        onAdd(newItem)
        setFormData({
          pageRef: "",
          description: "",
          unitId: "",
          rate: "",
          length: "1",
          width: "1",
          height: "1",
        })
        setSubItems([])
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error adding work item:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
  
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl">
    <DialogHeader className="border-b pb-4">
      <DialogTitle className="text-2xl font-bold">➕ Add Work Item</DialogTitle>
      <DialogDescription className="text-gray-600">
        Create a new work item with dimensions or sub-item breakdown.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Rate Library */}
      <section className="bg-gray-50 border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          📚 Rate Library
        </h3>
        <Command className="rounded-lg border shadow-sm">
          <CommandInput placeholder="Search rates..." className="h-10" />
          <CommandEmpty>No rates found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {rates.map((rate) => (
              <CommandItem
                key={rate.id}
                value={rate.id}
                onSelect={() => handleRateSelect(rate.id)}
                className="flex justify-between items-center cursor-pointer hover:bg-primary/5 px-4 py-2"
              >
                <span className="truncate">{rate.description}</span>
                <span className="text-primary font-medium">₹{rate.standardRate}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </section>

      {/* Basic Details */}
      <section className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">📝 Basic Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="pageRef">Page & Item Reference</Label>
            <Input
              id="pageRef"
              value={formData.pageRef}
              onChange={(e) => setFormData({ ...formData, pageRef: e.target.value })}
              placeholder="e.g., 1/2 a, 332/18.07"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitId">Unit *</Label>
            <Select
              value={formData.unitId}
              onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              required
            >
              <SelectTrigger id="unitId">
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

        <div className="mt-4 space-y-2">
          <Label htmlFor="description">Item Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter detailed work item description"
            required
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="rate">Rate (₹) *</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            placeholder="Enter rate"
            required
          />
        </div>
      </section>

      {/* Sub-items */}
      <section className="bg-gray-50 border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">📦 Sub-Items Breakdown</h3>
          <Button type="button" variant="outline" onClick={addSubItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sub-Item
          </Button>
        </div>

        {subItems.length > 0 ? (
          <div className="space-y-4">
            {subItems.map((item, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
                <div className="flex items-start gap-2">
                  <Input
                    placeholder="Sub-item description"
                    value={item.description}
                    onChange={(e) => updateSubItem(index, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <Input type="number" step="0.01" placeholder="Nos" value={item.nos}
                    onChange={(e) => updateSubItem(index, "nos", e.target.value)} />
                  <Input type="number" step="0.01" placeholder="Length" value={item.length}
                    onChange={(e) => updateSubItem(index, "length", e.target.value)} />
                  <Input type="number" step="0.01" placeholder="Breadth" value={item.breadth}
                    onChange={(e) => updateSubItem(index, "breadth", e.target.value)} />
                  <Input type="number" step="0.01" placeholder="Depth" value={item.depth}
                    onChange={(e) => updateSubItem(index, "depth", e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Qty:{" "}
                  {(
                    Number.parseFloat(item.nos) *
                    Number.parseFloat(item.length) *
                    Number.parseFloat(item.breadth) *
                    Number.parseFloat(item.depth)
                  ).toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="length">Length *</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width *</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height/Depth *</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                required
              />
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 bg-primary/5 border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-primary">{calculatedQuantity.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                ₹{calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Work Item
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

  )
}
