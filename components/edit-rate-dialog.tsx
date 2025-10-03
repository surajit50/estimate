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
import { Loader2 } from "lucide-react"

interface Rate {
  id: string
  description: string
  unitId: string
  standardRate: number
  year: string | null
}

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface EditRateDialogProps {
  rate: Rate | null
  onOpenChange: (open: boolean) => void
  onEdit: (rate: any) => void
  units: Unit[]
}

export function EditRateDialog({ rate, onOpenChange, onEdit, units }: EditRateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    unitId: "",
    standardRate: "",
    year: "",
  })

  useEffect(() => {
    if (rate) {
      setFormData({
        description: rate.description,
        unitId: rate.unitId,
        standardRate: rate.standardRate.toString(),
        year: rate.year || "",
      })
    }
  }, [rate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rate) return

    setLoading(true)

    try {
      const response = await fetch(`/api/rates/${rate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          standardRate: Number.parseFloat(formData.standardRate),
        }),
      })

      if (response.ok) {
        const updatedRate = await response.json()
        onEdit(updatedRate)
      }
    } catch (error) {
      console.error("Error updating rate:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={rate !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Rate</DialogTitle>
          <DialogDescription>Update the standard rate details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Item Description *</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Excavation in ordinary soil"
                required
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
            <div className="space-y-2">
              <Label htmlFor="edit-standardRate">Standard Rate (₹) *</Label>
              <Input
                id="edit-standardRate"
                type="number"
                step="0.01"
                value={formData.standardRate}
                onChange={(e) => setFormData({ ...formData, standardRate: e.target.value })}
                placeholder="e.g., 150.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year/Revision</Label>
              <Input
                id="edit-year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g., 2024-25"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Rate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
