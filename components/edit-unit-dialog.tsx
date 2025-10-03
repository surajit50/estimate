"use client"

import * as React from "react"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Loader2 } from "lucide-react"
import type { UnitMasterType } from "@/lib/types"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { unitSchema, type UnitFormValues } from "@/lib/schemas"

interface EditUnitDialogProps {
  unit: UnitMasterType | null
  onOpenChange: (open: boolean) => void
  onEdit: (unit: UnitMasterType) => void
}

export function EditUnitDialog({ unit, onOpenChange, onEdit }: EditUnitDialogProps) {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { unitName: "", unitSymbol: "" },
  })

  useEffect(() => {
    if (unit) {
      form.reset({ unitName: unit.unitName, unitSymbol: unit.unitSymbol })
    }
  }, [unit])

  const onSubmit = async (values: UnitFormValues) => {
    if (!unit) return
    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        const updatedUnit = await response.json()
        onEdit(updatedUnit)
      }
    } catch (error) {
      console.error("Error updating unit:", error)
    }
  }

  return (
    <Dialog open={unit !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Unit</DialogTitle>
          <DialogDescription>Update the measurement unit details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="unitName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Square Meter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Symbol *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., m²" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Unit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
