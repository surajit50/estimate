"use client"

import type React from "react"

import { useState } from "react"
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

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface AddRateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (rate: any) => void
  units: Unit[]
}

export function AddRateDialog({ open, onOpenChange, onAdd, units }: AddRateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    unitId: "",
    standardRate: "",
    year: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          standardRate: Number.parseFloat(formData.standardRate),
        }),
      })

      if (response.ok) {
        const newRate = await response.json()
        onAdd(newRate)
        setFormData({ description: "", unitId: "", standardRate: "", year: "" })
      }
    } catch (error) {
      console.error("Error adding rate:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Rate</DialogTitle>
          <DialogDescription>Add a new standard rate to the library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Item Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Excavation in ordinary soil"
                required
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
            <div className="space-y-2">
              <Label htmlFor="standardRate">Standard Rate (₹) *</Label>
              <Input
                id="standardRate"
                type="number"
                step="0.01"
                value={formData.standardRate}
                onChange={(e) => setFormData({ ...formData, standardRate: e.target.value })}
                placeholder="e.g., 150.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year/Revision</Label>
              <Input
                id="year"
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
              Add Rate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
