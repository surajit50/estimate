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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { unitSchema, type UnitFormValues } from "@/lib/schemas"
import { createUnit } from "@/lib/actions/units"

interface AddUnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (unit: any) => void
}

export function AddUnitDialog({ open, onOpenChange, onAdd }: AddUnitDialogProps) {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { unitName: "", unitSymbol: "" },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ unitName: "", unitSymbol: "" })
    }
  }, [open])

  const onSubmit = async (values: UnitFormValues) => {
    try {
      const result = await createUnit(values)

      if (result.success) {
        onAdd(result.data)
        form.reset({ unitName: "", unitSymbol: "" })
      } else {
        console.error("Error adding unit:", result.error)
      }
    } catch (error) {
      console.error("Error adding unit:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogDescription>Add a new measurement unit to the system.</DialogDescription>
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
                Add Unit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
