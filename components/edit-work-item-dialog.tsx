"use client"

import * as React from "react"

import { useEffect } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
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
import { Loader2, Plus } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

import type { WorkItemWithUnit, UnitMasterType, RateLibraryType } from "@/lib/types"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { nonEmptyString } from "@/lib/schemas"
import { z } from "zod"
import { updateWorkItem } from "@/lib/actions/work-items"

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

const workItemEditSchema = z.object({
  pageRef: z.string().optional().default(""),
  description: nonEmptyString,
  unitId: nonEmptyString,
  rate: z.coerce.number().positive("Must be > 0"),
  subItems: z.array(z.object({
    id: z.string().optional(),
    description: z.string().optional().default(""),
    nos: z.coerce.number().positive("Must be > 0"),
    length: z.coerce.number().positive("Must be > 0"),
    breadth: z.coerce.number().positive("Must be > 0"),
    depth: z.coerce.number().positive("Must be > 0"),
  })).optional().default([]),
  subCategories: z.array(z.object({
    id: z.string().optional(),
    categoryName: z.string().optional().default(""),
    description: z.string().optional().default(""),
    subItems: z.array(z.object({
      id: z.string().optional(),
      description: z.string().optional().default(""),
      nos: z.coerce.number().positive("Must be > 0"),
      length: z.coerce.number().positive("Must be > 0"),
      breadth: z.coerce.number().positive("Must be > 0"),
      depth: z.coerce.number().positive("Must be > 0"),
    })).optional().default([]),
  })).optional().default([]),
})

type WorkItemEditFormValues = z.infer<typeof workItemEditSchema>

export function EditWorkItemDialog({ item, onOpenChange, onEdit, units, rates }: EditWorkItemDialogProps) {
  const form = useForm<WorkItemEditFormValues>({
    resolver: zodResolver(workItemEditSchema),
    defaultValues: {
      pageRef: "",
      description: "",
      unitId: "",
      rate: 0,
      subItems: [],
      subCategories: [],
    },
  })

  const { fields: subItemFields, append: appendSubItem } = useFieldArray({ 
    control: form.control, 
    name: "subItems" 
  })

  const { fields: subCategoryFields, append: appendSubCategory } = useFieldArray({ 
    control: form.control, 
    name: "subCategories" 
  })

  useEffect(() => {
    if (item) {
      const hasSubCategories = item.subCategories && item.subCategories.length > 0
      const hasSubItems = item.subItems && item.subItems.length > 0

      if (hasSubCategories) {
        // Use existing sub-categories
        form.reset({
          pageRef: item.pageRef || "",
          description: item.description,
          unitId: item.unitId,
          rate: item.rate,
          subCategories: (item.subCategories || []).map((category) => ({
            id: category.id,
            categoryName: category.categoryName,
            description: category.description || "",
            subItems: (category.subItems || []).map((s) => ({
              id: s.id,
              description: s.description,
              nos: s.nos,
              length: s.length,
              breadth: s.breadth,
              depth: s.depth,
            })),
          })),
          subItems: [],
        })
      } else if (hasSubItems) {
        // Use existing direct sub-items
        form.reset({
          pageRef: item.pageRef || "",
          description: item.description,
          unitId: item.unitId,
          rate: item.rate,
          subItems: (item.subItems || []).map((s) => ({
            id: s.id,
            description: s.description,
            nos: s.nos,
            length: s.length,
            breadth: s.breadth,
            depth: s.depth,
          })),
          subCategories: [],
        })
      } else {
        // Convert old length/width/height to a sub-item
        form.reset({
          pageRef: item.pageRef || "",
          description: item.description,
          unitId: item.unitId,
          rate: item.rate,
          subItems: [
            {
              description: item.description,
              nos: 1,
              length: item.length || 1,
              breadth: item.width || 1, // Note: width becomes breadth
              depth: item.height || 1,
            },
          ],
          subCategories: [],
        })
      }
    }
  }, [item, form])

  // Reactive watchers for totals (works well with Field Arrays)
  const watchedRate = Number(useWatch({ control: form.control, name: "rate" }) ?? 0)
  const watchedUnitId = useWatch({ control: form.control, name: "unitId" }) ?? ""
  const watchedSubItems = (useWatch({ control: form.control, name: "subItems" }) as any[]) || []
  const watchedSubCategories = (useWatch({ control: form.control, name: "subCategories" }) as any[]) || []

  const selectedUnitSymbol = React.useMemo(
    () => units.find((u) => u.id === watchedUnitId)?.unitSymbol || "",
    [units, watchedUnitId]
  )

  // Simple helpers to guide quantity behavior
  const isAreaUnit = (symbol: string) => {
    const s = (symbol || "").toLowerCase()
    return s === "m2" || s === "m²" || s.includes("square") || s === "sqm"
  }
  const isVolumeUnit = (symbol: string) => {
    const s = (symbol || "").toLowerCase()
    return s === "m3" || s === "m³" || s.includes("cubic") || s === "cum"
  }

  const calculateSubItemQuantity = React.useCallback((subItem: any, unitSymbol: string) => {
    const n = Number(subItem?.nos) || 0
    const l = Number(subItem?.length) || 0
    const b = Number(subItem?.breadth) || 0
    const d = Number(subItem?.depth) || 0
    const s = (unitSymbol || "").toLowerCase()

    if (s === "nos" || s.includes("each")) return n
    if (s === "m" || s === "rm" || s.includes("running")) return n * l
    if (isAreaUnit(s)) return n * l * b
    if (isVolumeUnit(s)) return n * l * b * d
    if (s === "kg" || s === "bag" || s === "mt") return n
    const hasAnyDim = l > 0 || b > 0 || d > 0
    const dims = (l || 1) * (b || 1) * (d || 1)
    return hasAnyDim ? (n > 0 ? n * dims : dims) : n
  }, [])

  const calculatedQuantity = React.useMemo(() => {
    let totalQuantity = 0

    if (watchedSubItems && watchedSubItems.length > 0) {
      totalQuantity += watchedSubItems.reduce((sum: number, item: any) => {
        return sum + calculateSubItemQuantity(item, selectedUnitSymbol)
      }, 0)
    }

    if (watchedSubCategories && watchedSubCategories.length > 0) {
      watchedSubCategories.forEach((category: any) => {
        if (category.subItems && category.subItems.length > 0) {
          totalQuantity += category.subItems.reduce((sum: number, item: any) => {
            return sum + calculateSubItemQuantity(item, selectedUnitSymbol)
          }, 0)
        }
      })
    }

    return totalQuantity
  }, [watchedSubItems, watchedSubCategories, selectedUnitSymbol, calculateSubItemQuantity])

  const calculatedAmount = React.useMemo(() => {
    const r = Number(watchedRate) || 0
    return calculatedQuantity * r
  }, [watchedRate, calculatedQuantity])

  const onSubmit = async (values: WorkItemEditFormValues) => {
    if (!item) return
    try {
      const selectedUnit = units.find((u) => u.id === values.unitId)
      const pageItemParts = (values.pageRef || "").split("/")
      const pageRef = pageItemParts[0] || null
      const itemRef = pageItemParts[1] || null

      const result = await updateWorkItem(item.id, {
        pageRef,
        itemRef: itemRef || undefined,
        description: values.description,
        unitId: values.unitId,
        rate: values.rate,
        quantity: calculatedQuantity,
        amount: calculatedAmount,
        subItems: (values.subItems || []).map((s) => ({
          description: s.description,
          nos: s.nos,
          length: s.length,
          breadth: s.breadth,
          depth: s.depth,
          quantity: calculateSubItemQuantity(s, selectedUnit?.unitSymbol || ""),
          unitSymbol: selectedUnit?.unitSymbol || "",
        })),
        subCategories: (values.subCategories || []).map((category) => ({
          categoryName: category.categoryName || "",
          description: category.description || "",
          subItems: (category.subItems || []).map((s) => ({
            description: s.description,
            nos: s.nos,
            length: s.length,
            breadth: s.breadth,
            depth: s.depth,
            quantity: calculateSubItemQuantity(s, selectedUnit?.unitSymbol || ""),
            unitSymbol: selectedUnit?.unitSymbol || "",
          })),
        })),
      })

      if (result.success && result.data) {
        onEdit(result.data as unknown as WorkItemWithUnit)
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

              {/* Structure Selection */}
              <section className="bg-blue-50 border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">🏗️ Work Item Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.setValue("subCategories", [])
                      appendSubItem({ description: "", nos: 1, length: 1, breadth: 1, depth: 1 })
                    }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-medium">Direct Sub-Items</div>
                    <div className="text-xs text-gray-600">Simple quantity breakdown</div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.setValue("subItems", [])
                      appendSubCategory({ 
                        categoryName: "", 
                        description: "", 
                        subItems: [{ description: "", nos: 1, length: 1, breadth: 1, depth: 1 }] 
                      })
                    }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">🏛️</div>
                    <div className="font-medium">Hierarchical Structure</div>
                    <div className="text-xs text-gray-600">Categories with sub-items</div>
                  </Button>
                </div>
              </section>

              {/* Sub-categories */}
              {subCategoryFields.length > 0 && (
                <section className="bg-gray-50 border rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">🏛️ Sub-Categories</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Organize work items into categories (e.g., "A: Lead upto 100 m", "B: Lead upto 1000 m")
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendSubCategory({ 
                        categoryName: "", 
                        description: "", 
                        subItems: [{ description: "", nos: 1, length: 1, breadth: 1, depth: 1 }] 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {subCategoryFields.map((category, categoryIndex) => (
                      <div key={category.id} className="p-4 bg-white rounded-lg border shadow-sm">
                        <div className="flex items-start gap-2 mb-4">
                          <FormField
                            control={form.control}
                            name={`subCategories.${categoryIndex}.categoryName` as const}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-sm font-medium">Category Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., A: Lead upto 100 m" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* Remove action disabled in dialog */}
                        </div>

                        <FormField
                          control={form.control}
                          name={`subCategories.${categoryIndex}.description` as const}
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel className="text-sm font-medium">Category Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional description for this category" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Sub-items within this category */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Sub-items in this category</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentSubItems = form.getValues(`subCategories.${categoryIndex}.subItems`) || []
                                form.setValue(`subCategories.${categoryIndex}.subItems`, [
                                  ...currentSubItems,
                                  { description: "", nos: 1, length: 1, breadth: 1, depth: 1 }
                                ])
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Sub-Item
                            </Button>
                          </div>

                          {form.watch(`subCategories.${categoryIndex}.subItems`)?.map((subItem: any, subItemIndex: number) => (
                            <div key={subItemIndex} className="p-3 bg-gray-50 rounded border space-y-3">
                              <div className="flex items-start gap-2">
                                <FormField
                                  control={form.control}
                                  name={`subCategories.${categoryIndex}.subItems.${subItemIndex}.description` as const}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormLabel className="text-xs">Sub-item Description</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Girth above 300 mm to 600 mm" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {/* Remove action disabled in dialog */}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <FormField
                                  control={form.control}
                                  name={`subCategories.${categoryIndex}.subItems.${subItemIndex}.nos` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Nos</FormLabel>
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
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`subCategories.${categoryIndex}.subItems.${subItemIndex}.length` as const}
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
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`subCategories.${categoryIndex}.subItems.${subItemIndex}.breadth` as const}
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
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`subCategories.${categoryIndex}.subItems.${subItemIndex}.depth` as const}
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
                                  )}
                                />
                                <div className="flex flex-col justify-end">
                                  <FormLabel className="text-xs">Sub-total</FormLabel>
                                  <p className="text-sm font-medium text-primary py-2">
                                    {(() => {
                                      const nos = Number(form.watch(`subCategories.${categoryIndex}.subItems.${subItemIndex}.nos`) || 0)
                                      const length = Number(form.watch(`subCategories.${categoryIndex}.subItems.${subItemIndex}.length`) || 0)
                                      const breadth = Number(form.watch(`subCategories.${categoryIndex}.subItems.${subItemIndex}.breadth`) || 0)
                                      const depth = Number(form.watch(`subCategories.${categoryIndex}.subItems.${subItemIndex}.depth`) || 0)
                                      return ((nos * length * breadth * depth) || 0).toFixed(3)
                                    })()}{" "}
                                    m³
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Direct Sub-items */}
              {subItemFields.length > 0 && (
                <section className="bg-gray-50 border rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">📦 Direct Sub-Items</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Add sub-items directly to calculate total quantity. Each sub-item requires dimensions.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendSubItem({ description: "", nos: 1, length: 1, breadth: 1, depth: 1 })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sub-Item
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {subItemFields.map((item, index) => (
                      <div key={item.id} className="p-4 bg-white rounded-lg border shadow-sm space-y-4">
                        <div className="flex items-start gap-2">
                          <FormField
                            control={form.control}
                            name={`subItems.${index}.description` as const}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-sm font-medium">Sub-item Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Describe this part of the work..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* Remove action disabled in dialog */}
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
                                    onChange={(e) => {
                                      const v = e.target.value
                                      field.onChange(v)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex flex-col justify-end">
                            <FormLabel className="text-xs">Sub-total</FormLabel>
                            <p className="text-sm font-medium text-primary py-2">
                              {(() => {
                                const sub = (form.getValues(`subItems.${index}`) as any) || {}
                                return calculateSubItemQuantity(sub, selectedUnitSymbol).toFixed(3)
                              })()} {selectedUnitSymbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Summary */}
              <div className="mt-6 bg-primary/5 border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                    <p className="text-2xl font-bold text-primary">{calculatedQuantity.toFixed(3)} {selectedUnitSymbol}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
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
