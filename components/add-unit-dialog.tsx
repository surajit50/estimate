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
import { Loader2 } from "lucide-react"

interface AddUnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (unit: any) => void
}

export function AddUnitDialog({ open, onOpenChange, onAdd }: AddUnitDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    unitName: "",
    unitSymbol: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newUnit = await response.json()
        onAdd(newUnit)
        setFormData({ unitName: "", unitSymbol: "" })
      }
    } catch (error) {
      console.error("Error adding unit:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogDescription>Add a new measurement unit to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">Unit Name *</Label>
              <Input
                id="unitName"
                value={formData.unitName}
                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                placeholder="e.g., Square Meter"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitSymbol">Unit Symbol *</Label>
              <Input
                id="unitSymbol"
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
              Add Unit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
