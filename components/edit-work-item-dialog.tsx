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
      length: 0,
      width: 0,
      height: 0,
      subItems: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "subItems" })

  useEffect(() => {
    if (item) {
      form.reset({
        pageRef: item.pageRef || "",
        description: item.description,
        unitId: item.unitId,
        rate: item.rate,
        length: item.length,
        width: item.width,
        height: item.height,
        subItems: item.subItems?.map((s) => ({
          id: s.id,
          description: s.description,
          nos: s.nos,
          length: s.length,
          breadth: s.breadth,
          depth: s.depth,
        })) || [],
      })
    }
  }, [item])

  const watch = form.watch
  const watchedLength = watch("length")
  const watchedWidth = watch("width")
  const watchedHeight = watch("height")
  const watchedRate = watch("rate")
  const watchedSubItems = watch("subItems")

  const calculatedQuantity = React.useMemo(() => {
    if (watchedSubItems && watchedSubItems.length > 0) {
      return watchedSubItems.reduce((sum: number, si: any) => sum + (Number(si.nos) || 0) * (Number(si.length) || 0) * (Number(si.breadth) || 0) * (Number(si.depth) || 0), 0)
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
          length: values.length,
          width: values.width,
          height: values.height,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Work Item</DialogTitle>
          <DialogDescription>Update the work item details with automatic recalculation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="pageRef" render={({ field }) => (
                <FormItem>
                  <FormLabel>Page & Item Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1/2 a, 332/18.07" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unitId" render={({ field }) => (
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
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Item Description *</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Enter work item description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="rate" render={({ field }) => (
              <FormItem>
                <FormLabel>Rate (₹) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter rate" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Sub-items section */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Sub-Items (Optional)</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", nos: 1, length: 1, breadth: 1, depth: 1 })}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sub-Item
                </Button>
              </div>

              {fields.length > 0 ? (
                <div className="space-y-3">
                  {fields.map((f, index) => (
                    <div key={index} className="p-3 bg-background rounded border space-y-3">
                      <div className="flex items-start gap-2">
                        <FormField control={form.control} name={`subItems.${index}.description` as const} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Sub-item description" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
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
                      <p className="text-xs text-muted-foreground">Qty: {(((form.getValues(`subItems.${index}.nos`) || 0) as number) * ((form.getValues(`subItems.${index}.length`) || 0) as number) * ((form.getValues(`subItems.${index}.breadth`) || 0) as number) * ((form.getValues(`subItems.${index}.depth`) || 0) as number)).toFixed(3)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-lg font-bold">{calculatedQuantity.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">
                  ₹{calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Work Item
            </Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
