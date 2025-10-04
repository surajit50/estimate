"use client"

import * as React from "react"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

import type { WorkItemWithUnit, SubWorkItemType, UnitMasterType, RateLibraryType } from "@/lib/types"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { workItemSchema, type WorkItemFormValues } from "@/lib/schemas"

type EditableSubItem = {
  id?: string
  description: string
  nos: number
  length: number
  breadth: number
  depth: number
  quantity: number
  unitSymbol?: string
}

type Unit = UnitMasterType
type Rate = RateLibraryType

interface EditWorkItemDialogProps {
  item: WorkItemWithUnit | null
  onOpenChange: (open: boolean) => void
  onEdit: (item: any) => void
  units: Unit[]
  rates: Rate[]
}

export function EditWorkItemDialog({ item, onOpenChange, onEdit, units, rates }: EditWorkItemDialogProps) {
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

  useEffect(() => {
    if (item) {
      // Convert old structure to new structure if needed
      const hasSubItems = item.subItems && item.subItems.length > 0
      
      if (hasSubItems) {
        // Use existing sub-items
        form.reset({
          pageRef: item.pageRef || "",
          description: item.description,
          unitId: item.unitId,
          rate: item.rate,
          subItems: item.subItems.map((s) => ({
            id: s.id,
            description: s.description,
            nos: s.nos,
            length: s.length,
            breadth: s.breadth,
            depth: s.depth,
          })),
        })
      } else {
        // Convert old length/width/height to a sub-item
        form.reset({
          pageRef: item.pageRef || "",
          description: item.description,
          unitId: item.unitId,
          rate: item.rate,
          subItems: [{
            description: item.description,
            nos: 1,
            length: item.length || 1,
            breadth: item.width || 1, // Note: width becomes breadth
            depth: item.height || 1,
          }],
        })
      }
    }
  }, [item, form])

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

  const onSubmit = async (values: WorkItemFormValues) => {
    if (!item) return
    try {
      const selectedUnit = units.find((u) => u.id === values.unitId)
      const pageItemParts = (values.pageRef || "").split("/")
      const pageRef = pageItemParts[0] || null
      const itemRef = pageItemParts[1] || null

      const response = await fetch(`/api/work-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageRef,
          itemRef,
          description: values.description,
          unitId: values.unitId,
          rate: values.rate,
          quantity: calculatedQuantity,
          amount: calculatedAmount,
          subItems: (values.subItems || []).map((s) => ({
            id: (s as any).id,
            description: s.description,
            nos: s.nos,
            length: s.length,
            breadth: s.breadth,
            depth: s.depth,
            quantity: s.nos * s.length * s.breadth * s.depth,
            unitSymbol: selectedUnit?.unitSymbol || "",
          })),
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        onEdit(updatedItem)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error updating work item:", error)
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col rounded-xl p-0 overflow-hidden">
        <DialogHeader className="border-b bg-white px-6 py-4 shrink-0">
          <DialogTitle className="text-2xl font-bold">✏️ Edit Work Item</DialogTitle>
          <DialogDescription>
            Update the work item details with sub-item breakdown for accurate quantity calculation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
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

              {/* Sub-items */}
              <section className="bg-gray-50 border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">📦 Quantity Calculation</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Update sub-items to calculate total quantity. Each sub-item requires dimensions.
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
                  {fields.map((fieldItem, index) => (
                    <div key={fieldItem.id} className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="shrink-0 mt-7"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
                            <FormMessage />
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
                            <FormMessage />
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
                            <FormMessage />
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
                            <FormMessage />
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
                  Update Work Item
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
