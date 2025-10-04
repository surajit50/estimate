"use client"

import * as React from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
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
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { workItemSchema, type WorkItemFormValues } from "@/lib/schemas"

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
  const form = useForm<WorkItemFormValues>({
    resolver: zodResolver(workItemSchema),
    defaultValues: {
      pageRef: "",
      description: "",
      unitId: "",
      rate: 0,
      length: 1,
      width: 1,
      height: 1,
      subItems: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "subItems" })

  React.useEffect(() => {
    if (!open) {
      form.reset({ pageRef: "", description: "", unitId: "", rate: 0, length: 1, width: 1, height: 1, subItems: [] })
    }
  }, [open])

  const watch = form.watch
  const watchedLength = watch("length")
  const watchedWidth = watch("width")
  const watchedHeight = watch("height")
  const watchedRate = watch("rate")
  const watchedSubItems = watch("subItems")

  const calculatedQuantity = React.useMemo(() => {
    if (watchedSubItems && watchedSubItems.length > 0) {
      return watchedSubItems.reduce((sum: number, item: any) => {
        const nos = Number(item.nos) || 0
        const length = Number(item.length) || 0
        const breadth = Number(item.breadth) || 0
        const depth = Number(item.depth) || 0
        return sum + nos * length * breadth * depth
      }, 0)
    }
    const l = Number(watchedLength) || 0
    const w = Number(watchedWidth) || 0
    const h = Number(watchedHeight) || 0
    return l * w * h
  }, [watchedSubItems, watchedLength, watchedWidth, watchedHeight])

  const calculatedAmount = React.useMemo(() => {
    const r = Number(watchedRate) || 0
    return calculatedQuantity * r
  }, [watchedRate, calculatedQuantity])

  const handleRateSelect = (rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId)
    if (selectedRate) {
      form.setValue("description", selectedRate.description)
      form.setValue("unitId", selectedRate.unitId)
      form.setValue("rate", Number(selectedRate.standardRate))
    }
  }

  const onSubmit = async (values: WorkItemFormValues) => {
    try {
      const selectedUnit = units.find((u) => u.id === values.unitId)
      const response = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          itemNo: nextItemNo,
          pageRef: values.pageRef || null,
          description: values.description,
          unitId: values.unitId,
          rate: values.rate,
          length: values.length,
          width: values.width,
          height: values.height,
          quantity: calculatedQuantity,
          amount: calculatedAmount,
          subItems: (values.subItems || []).map((item) => ({
            description: item.description,
            nos: item.nos,
            length: item.length,
            breadth: item.breadth,
            depth: item.depth,
            quantity: item.nos * item.length * item.breadth * item.depth,
            unitSymbol: selectedUnit?.unitSymbol || "",
          })),
        }),
      })

      if (response.ok) {
        const newItem = await response.json()
        onAdd(newItem)
        form.reset({ pageRef: "", description: "", unitId: "", rate: 0, length: 1, width: 1, height: 1, subItems: [] })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error adding work item:", error)
    }
  }

  return (
  
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl">
    <DialogHeader className="border-b pb-4">
      <DialogTitle className="text-2xl font-bold">➕ Add Work Item</DialogTitle>
      <DialogDescription className="text-gray-600">
        Create a new work item with dimensions or sub-item breakdown.
      </DialogDescription>
    </DialogHeader>

    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          <FormField
            control={form.control}
            name="pageRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page & Item Reference</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1/2 a, 332/18.07" {...field} />
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Item Description *</FormLabel>
              <FormControl>
                <Textarea rows={3} className="resize-none" placeholder="Enter detailed work item description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Rate (₹) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Enter rate" value={field.value ?? ""} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      {/* Sub-items */}
      <section className="bg-gray-50 border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">📦 Sub-Items Breakdown</h3>
          <Button type="button" variant="outline" onClick={() => append({ description: "", nos: 1, length: 1, breadth: 1, depth: 1 })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sub-Item
          </Button>
        </div>

        {fields.length > 0 ? (
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
                <div className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`subItems.${index}.description` as const}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Sub-item description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <FormField control={form.control} name={`subItems.${index}.nos` as const} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Nos" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`subItems.${index}.length` as const} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Length" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`subItems.${index}.breadth` as const} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Breadth" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`subItems.${index}.depth` as const} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Depth" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Qty:{" "}
                  {(
                    (Number(item.nos) || 0) *
                    (Number((item as any).length) || 0) *
                    (Number((item as any).breadth) || 0) *
                    (Number((item as any).depth) || 0)
                  ).toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <FormField control={form.control} name="length" render={({ field }) => (
              <FormItem>
                <FormLabel>Length *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="width" render={({ field }) => (
              <FormItem>
                <FormLabel>Width *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="height" render={({ field }) => (
              <FormItem>
                <FormLabel>Height/Depth *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
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
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Work Item
        </Button>
      </DialogFooter>
    </form>
    </Form>
  </DialogContent>
</Dialog>

  )
}
