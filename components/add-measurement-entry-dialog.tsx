"use client"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface AddMeasurementEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  measurementBookId: string
  onSuccess?: () => void
}

export function AddMeasurementEntryDialog({
  open,
  onOpenChange,
  measurementBookId,
  onSuccess,
}: AddMeasurementEntryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    pageNo: "",
    itemNo: "",
    description: "",
    unitId: "",
    length: "",
    width: "",
    height: "",
    quantity: "",
    remarks: "",
  })

  // Load units on component mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch("/api/units")
        if (response.ok) {
          const unitsData = await response.json()
          setUnits(unitsData)
        }
      } catch (error) {
        console.error("Error fetching units:", error)
      }
    }

    if (open) {
      fetchUnits()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/measurement-books/${measurementBookId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          length: parseFloat(formData.length) || 0,
          width: parseFloat(formData.width) || 0,
          height: parseFloat(formData.height) || 0,
          quantity: parseFloat(formData.quantity) || 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create measurement entry")
      }

      toast.success("Measurement entry created successfully!")
      onOpenChange(false)
      if (onSuccess) onSuccess()
      
      // Reset form
      setFormData({
        entryDate: new Date().toISOString().split('T')[0],
        pageNo: "",
        itemNo: "",
        description: "",
        unitId: "",
        length: "",
        width: "",
        height: "",
        quantity: "",
        remarks: "",
      })
    } catch (error) {
      console.error("Error creating measurement entry:", error)
      toast.error("Failed to create measurement entry")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Measurement Entry</DialogTitle>
          <DialogDescription>
            Add a new measurement entry to track work progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date *</Label>
              <Input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) => handleInputChange("entryDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageNo">Page No. *</Label>
              <Input
                id="pageNo"
                value={formData.pageNo}
                onChange={(e) => handleInputChange("pageNo", e.target.value)}
                placeholder="e.g., 1/2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemNo">Item No. *</Label>
              <Input
                id="itemNo"
                value={formData.itemNo}
                onChange={(e) => handleInputChange("itemNo", e.target.value)}
                placeholder="e.g., 1, 2, 3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">Unit *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => handleInputChange("unitId", value)}
                required
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

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the work item"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length (m)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                value={formData.length}
                onChange={(e) => handleInputChange("length", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Width (m)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={formData.width}
                onChange={(e) => handleInputChange("width", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (m)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Additional notes (optional)"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
