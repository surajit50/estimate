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
import { Loader2 } from "lucide-react"

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface EditUnitDialogProps {
  unit: Unit | null
  onOpenChange: (open: boolean) => void
  onEdit: (unit: Unit) => void
}

export function EditUnitDialog({ unit, onOpenChange, onEdit }: EditUnitDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    unitName: "",
    unitSymbol: "",
  })

  useEffect(() => {
    if (unit) {
      setFormData({
        unitName: unit.unitName,
        unitSymbol: unit.unitSymbol,
      })
    }
  }, [unit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unit) return

    setLoading(true)

    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedUnit = await response.json()
        onEdit(updatedUnit)
      }
    } catch (error) {
      console.error("Error updating unit:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={unit !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Unit</DialogTitle>
          <DialogDescription>Update the measurement unit details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-unitName">Unit Name *</Label>
              <Input
                id="edit-unitName"
                value={formData.unitName}
                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                placeholder="e.g., Square Meter"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unitSymbol">Unit Symbol *</Label>
              <Input
                id="edit-unitSymbol"
                value={formData.unitSymbol}
                onChange={(e) => setFormData({ ...formData, unitSymbol: e.target.value })}
                placeholder="e.g., m²"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Unit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
