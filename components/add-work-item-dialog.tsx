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

interface AddWorkItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: any) => void
  estimateId: string
  units: Unit[]
  rates: Rate[]
  nextItemNo: number
}

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
      subItems: [{ description: "", nos: 1, length: 1, breadth: 1, depth: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "subItems" })

  React.useEffect(() => {
    if (!open) {
      form.reset({ 
        pageRef: "", 
        description: "", 
        unitId: "", 
        rate: 0, 
        subItems: [{ description: "", nos: 1, length: 1, breadth: 1, depth: 1 }] 
      })
    }
  }, [open, form])

  const watch = form.watch
  const watchedRate = watch("rate")
  const watchedSubItems = watch("subItems")

  const calculatedQuantity = React.useMemo(() => {
    if (!watchedSubItems || watchedSubItems.length === 0) return 0
    
    return watchedSubItems.reduce((sum: number, item: any) => {
      const nos = Number(item.nos) || 0
      const length = Number(item.length) || 0
      const breadth = Number(item.breadth) || 0
      const depth = Number(item.depth) || 0
      return sum + nos * length * breadth * depth
    }, 0)
  }, [watchedSubItems])

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
        form.reset({ 
          pageRef: "", 
          description: "", 
          unitId: "", 
          rate: 0, 
          subItems: [{ description: "", nos: 1, length: 1, breadth: 1, depth: 1 }] 
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error adding work item:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col rounded-xl p-0 overflow-hidden">
        <DialogHeader className="border-b bg-white px-6 py-4 shrink-0">
          <DialogTitle className="text-2xl font-bold">➕ Add Work Item</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new work item with sub-item breakdown for accurate quantity calculation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Rate Library */}
              <section className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📚 Rate Library
                </h3>
                <Command className="rounded-lg border shadow-sm">
                  <CommandInput placeholder="Search rates..." className="h-10" />
                  <CommandEmpty>No rates found.</CommandEmpty>
                  <CommandGroup className="max-h-[160px] overflow-auto">
                    {rates.map((rate) => (
                      <CommandItem
                        key={rate.id}
                        value={rate.id}
                        onSelect={() => handleRateSelect(rate.id)}
                        className="flex justify-between items-center cursor-pointer hover:bg-primary/5 px-4 py-2"
                      >
                        <span className="truncate flex-1">{rate.description}</span>
                        <span className="text-primary font-medium ml-2 shrink-0">
                          ₹{rate.standardRate}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </section>

              {/* Basic Details */}
              <section className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">📝 Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Textarea 
                          rows={3} 
                          className="resize-none" 
                          placeholder="Enter detailed work item description" 
                          {...field} 
                        />
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
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter rate" 
                          value={field.value ?? ""} 
                          onChange={field.onChange} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Sub-items - Now the main way to define quantity */}
              <section className="bg-gray-50 border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">📦 Quantity Calculation</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Add sub-items to calculate total quantity. Each sub-item requires dimensions.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => append({ description: "", nos: 1, length: 1, breadth: 1, depth: 1 })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub-Item
                  </Button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {fields.map((item, index) => (
                    <div key={item.id} className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
                      <div className="flex items-start gap-2">
                        <FormField
                          control={form.control}
                          name={`subItems.${index}.description` as const}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-sm font-medium">Sub-item Description</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Describe this part of the work..." 
                                  {...field} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="shrink-0 mt-7"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <FormField 
                          control={form.control} 
                          name={`subItems.${index}.nos` as const} 
                          render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantity (Nos)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="Nos" 
                                value={field.value ?? ""} 
                                onChange={field.onChange} 
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField 
                          control={form.control} 
                          name={`subItems.${index}.length` as const} 
                          render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Length (m)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="Length" 
                                value={field.value ?? ""} 
                                onChange={field.onChange} 
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField 
                          control={form.control} 
                          name={`subItems.${index}.breadth` as const} 
                          render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Breadth (m)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="Breadth" 
                                value={field.value ?? ""} 
                                onChange={field.onChange} 
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField 
                          control={form.control} 
                          name={`subItems.${index}.depth` as const} 
                          render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Depth (m)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="Depth" 
                                value={field.value ?? ""} 
                                onChange={field.onChange} 
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                        <div className="flex flex-col justify-end">
                          <FormLabel className="text-xs">Sub-total</FormLabel>
                          <p className="text-sm font-medium text-primary py-2">
                            {(
                              (Number(watchedSubItems?.[index]?.nos) || 0) *
                              (Number(watchedSubItems?.[index]?.length) || 0) *
                              (Number(watchedSubItems?.[index]?.breadth) || 0) *
                              (Number(watchedSubItems?.[index]?.depth) || 0)
                            ).toFixed(3)} m³
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 bg-primary/5 border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                      <p className="text-2xl font-bold text-primary">{calculatedQuantity.toFixed(3)} m³</p>
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
            </div>

            {/* Sticky Footer */}
            <DialogFooter className="border-t bg-white px-6 py-4 shrink-0">
              <div className="flex w-full justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Work Item
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
