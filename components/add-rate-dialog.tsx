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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { rateSchema, type RateFormValues } from "@/lib/schemas"
import { createRate } from "@/lib/actions/rates"

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
  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { description: "", unitId: "", standardRate: 0, year: "" },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ description: "", unitId: "", standardRate: 0, year: "" })
    }
  }, [open])

  const onSubmit = async (values: RateFormValues) => {
    try {
      const result = await createRate(values)

      if (result.success) {
        onAdd(result.data)
        form.reset({ description: "", unitId: "", standardRate: 0, year: "" })
      } else {
        console.error("Error adding rate:", result.error)
      }
    } catch (error) {
      console.error("Error adding rate:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Rate</DialogTitle>
          <DialogDescription>Add a new standard rate to the library.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Excavation in ordinary soil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standardRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Rate (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 150.00" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year/Revision</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2024-25" {...field} />
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
                Add Rate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
