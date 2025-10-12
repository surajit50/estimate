"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createWorkItem } from "@/lib/actions/work-items"
import { simpleWorkItemSchema } from "@/lib/schemas"

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

interface AddWorkItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: any) => void
  estimateId: string
  units: Unit[]
  rates: Rate[]
  nextItemNo: number
}

export default function AddWorkItemDialog({
  open,
  onOpenChange,
  onAdd,
  estimateId,
  units,
  rates,
  nextItemNo,
}: AddWorkItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const form = useForm({
    resolver: zodResolver(simpleWorkItemSchema),
    defaultValues: {
      pageRef: "",
      description: "",
      unitId: "",
      rate: 0,
      quantity: 0,
    },
  })

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset({
        pageRef: "",
        description: "",
        unitId: "",
        rate: 0,
        quantity: 0,
      })
      setError(null)
      setIsSubmitting(false)
    }
  }, [open, form])

  // Rate selection handler
  const handleRateSelect = (rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId)
    if (selectedRate) {
      form.setValue("description", selectedRate.description)
      form.setValue("unitId", selectedRate.unitId)
      form.setValue("rate", Number(selectedRate.standardRate))
    }
  }

  // Submit handler
  const onSubmit = async (values: any) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const amount = values.quantity * values.rate

      const payload = {
        estimateId,
        itemNo: nextItemNo,
        pageRef: values.pageRef || null,
        description: values.description,
        unitId: values.unitId,
        rate: values.rate,
        quantity: values.quantity,
        amount: amount,
        subItems: [],
        subCategories: [],
      }

      const result = await createWorkItem(payload)

      if (!result.success) {
        throw new Error(result.error || "Failed to create work item")
      }

      onAdd(result.data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding work item:", error)
      setError(error instanceof Error ? error.message : "Failed to create work item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Work Item</DialogTitle>
          <DialogDescription>
            Add a new work item to the estimate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Enter work item description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
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
                              {unit.unitSymbol}
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
                name="pageRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Ref</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1/2 a" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rate Library Quick Select */}
            {rates.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Quick Select</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {rates.slice(0, 6).map((rate) => (
                    <Button
                      key={rate.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleRateSelect(rate.id)}
                    >
                      {rate.description.length > 15 
                        ? `${rate.description.substring(0, 15)}...` 
                        : rate.description
                      } - ₹{rate.standardRate}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? "Adding..." : "Add Work Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
