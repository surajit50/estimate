"use client"

import * as React from "react"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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

interface SubItemFormValues {
  description: string
  nos: number
  length: number
  breadth: number
  depth: number
}

interface SubCategoryFormValues {
  categoryName: string
  description: string
  subItems: SubItemFormValues[]
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
      subCategories: [],
      subItems: [],
    },
  })

  const { fields: subItemFields, append: appendSubItem, remove: removeSubItem } = useFieldArray({
    control: form.control,
    name: "subItems",
  })

  const { fields: subCategoryFields, append: appendSubCategory, remove: removeSubCategory } = useFieldArray({
    control: form.control,
    name: "subCategories",
  })

  // Memoized computations
  const unitsMap = React.useMemo(() => 
    new Map(units.map(unit => [unit.id, unit])), 
    [units]
  )

  const selectedUnitId = form.watch("unitId")
  const selectedUnit = unitsMap.get(selectedUnitId)
  const unitSymbol = selectedUnit?.unitSymbol || "m³"

  const hasDirectSubItems = subItemFields.length > 0
  const hasHierarchicalStructure = subCategoryFields.length > 0

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset({
        pageRef: "",
        description: "",
        unitId: "",
        rate: 0,
        subCategories: [],
        subItems: [],
      })
    }
  }, [open, form, nextItemNo])

  const watch = form.watch
  const watchedRate = watch("rate")
  const watchedSubItems = watch("subItems")
  const watchedSubCategories = watch("subCategories")

  // Memoized quantity calculation
  const calculatedQuantity = React.useMemo(() => {
    let totalQuantity = 0

    // Calculate from direct sub-items
    if (watchedSubItems && watchedSubItems.length > 0) {
      totalQuantity += watchedSubItems.reduce((sum: number, item: any) => {
        const nos = Number(item.nos) || 0
        const length = Number(item.length) || 0
        const breadth = Number(item.breadth) || 0
        const depth = Number(item.depth) || 0
        return sum + nos * length * breadth * depth
      }, 0)
    }

    // Calculate from sub-categories
    if (watchedSubCategories && watchedSubCategories.length > 0) {
      watchedSubCategories.forEach((category: any) => {
        if (category.subItems && category.subItems.length > 0) {
          totalQuantity += category.subItems.reduce((sum: number, item: any) => {
            const nos = Number(item.nos) || 0
            const length = Number(item.length) || 0
            const breadth = Number(item.breadth) || 0
            const depth = Number(item.depth) || 0
            return sum + nos * length * breadth * depth
          }, 0)
        }
      })
    }

    return totalQuantity
  }, [watchedSubItems, watchedSubCategories])

  // Memoized amount calculation
  const calculatedAmount = React.useMemo(() => {
    const r = Number(watchedRate) || 0
    return calculatedQuantity * r
  }, [watchedRate, calculatedQuantity])

  // Memoized rate selection handler
  const handleRateSelect = React.useCallback((rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId)
    if (selectedRate) {
      form.setValue("description", selectedRate.description)
      form.setValue("unitId", selectedRate.unitId)
      form.setValue("rate", Number(selectedRate.standardRate))
    }
  }, [rates, form])

  // Form validation state
  const isFormValid = React.useMemo(() => {
    const basicFieldsValid = form.formState.isValid
    const hasStructure = hasDirectSubItems || hasHierarchicalStructure
    const hasPositiveQuantity = calculatedQuantity > 0
    const hasDescription = form.watch("description").trim().length > 0
    const hasUnit = form.watch("unitId").length > 0
    const hasRate = Number(form.watch("rate")) > 0

    return basicFieldsValid && hasStructure && hasPositiveQuantity && hasDescription && hasUnit && hasRate
  }, [
    form.formState.isValid, 
    hasDirectSubItems, 
    hasHierarchicalStructure, 
    calculatedQuantity,
    form.watch("description"),
    form.watch("unitId"),
    form.watch("rate")
  ])

  // Structure selection handlers
  const handleSelectDirectSubItems = React.useCallback(() => {
    form.setValue("subCategories", [])
    if (subItemFields.length === 0) {
      appendSubItem({ description: "", nos: 1, length: 1, breadth: 1, depth: 1 })
    }
  }, [form, subItemFields.length, appendSubItem])

  const handleSelectHierarchicalStructure = React.useCallback(() => {
    form.setValue("subItems", [])
    if (subCategoryFields.length === 0) {
      appendSubCategory({ 
        categoryName: "", 
        description: "", 
        subItems: [{ description: "", nos: 1, length: 1, breadth: 1, depth: 1 }] 
      })
    }
  }, [form, subCategoryFields.length, appendSubCategory])

  // Submit handler
  const onSubmit = async (values: WorkItemFormValues) => {
    try {
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
          subCategories: (values.subCategories || []).map((category) => ({
            categoryName: category.categoryName,
            description: category.description,
            subItems: category.subItems.map((item) => ({
              description: item.description,
              nos: item.nos,
              length: item.length,
              breadth: item.breadth,
              depth: item.depth,
              quantity: item.nos * item.length * item.breadth * item.depth,
              unitSymbol,
            })),
          })),
          subItems: (values.subItems || []).map((item) => ({
            description: item.description,
            nos: item.nos,
            length: item.length,
            breadth: item.breadth,
            depth: item.depth,
            quantity: item.nos * item.length * item.breadth * item.depth,
            unitSymbol,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create work item' }))
        throw new Error(errorData.message || 'Failed to create work item')
      }

      const newItem = await response.json()
      onAdd(newItem)
      form.reset({
        pageRef: "",
        description: "",
        unitId: "",
        rate: 0,
        subCategories: [],
        subItems: [],
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding work item:", error)
      // TODO: Add toast notification here
      // toast({
      //   title: "Error",
      //   description: error instanceof Error ? error.message : "Failed to create work item",
      //   variant: "destructive",
      // })
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Rate Library */}
              <section className="bg-gray-50 border rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">📚 Rate Library</h3>
                <Command className="rounded-lg border shadow-sm">
                  <CommandInput placeholder="Search rates..." className="h-10" />
                  <CommandList>
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
                          <span className="text-primary font-medium ml-2 shrink-0">₹{rate.standardRate}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
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

              {/* Structure Selection */}
              <section className="bg-blue-50 border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">🏗️ Work Item Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={hasDirectSubItems ? "default" : "outline"}
                    onClick={handleSelectDirectSubItems}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-medium">Direct Sub-Items</div>
                    <div className="text-xs text-gray-600">Simple quantity breakdown</div>
                  </Button>
                  <Button
                    type="button"
                    variant={hasHierarchicalStructure ? "default" : "outline"}
                    onClick={handleSelectHierarchicalStructure}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-2">🏛️</div>
                    <div className="font-medium">Hierarchical Structure</div>
                    <div className="text-xs text-gray-600">Categories with sub-items</div>
                  </Button>
                </div>
                
                {/* Structure Status */}
                <div className="mt-4 p-3 bg-white rounded border text-sm">
                  <p className="font-medium">Current Structure:</p>
                  <p className="text-gray-600">
                    {hasDirectSubItems && "📦 Direct Sub-Items"}
                    {hasHierarchicalStructure && "🏛️ Hierarchical Structure"}
                    {!hasDirectSubItems && !hasHierarchicalStructure && "No structure selected"}
                  </p>
                </div>
              </section>

              {/* Sub-categories */}
              {hasHierarchicalStructure && (
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
                          {subCategoryFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubCategory(categoryIndex)}
                              className="shrink-0 mt-7"
                              aria-label={`Remove category ${categoryIndex + 1}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentSubItems = form.getValues(`subCategories.${categoryIndex}.subItems`) || []
                                    const newSubItems = currentSubItems.filter((_: any, idx: number) => idx !== subItemIndex)
                                    form.setValue(`subCategories.${categoryIndex}.subItems`, newSubItems)
                                  }}
                                  className="shrink-0 mt-6"
                                  aria-label={`Remove sub-item ${subItemIndex + 1} from category ${categoryIndex + 1}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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
                                    {unitSymbol}
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
              {hasDirectSubItems && (
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
                          {subItemFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubItem(index)}
                              className="shrink-0 mt-7"
                              aria-label={`Remove sub-item ${index + 1}`}
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
                                    onChange={field.onChange}
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
                                    onChange={field.onChange}
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
                              {(
                                (Number(watchedSubItems?.[index]?.nos) || 0) *
                                (Number(watchedSubItems?.[index]?.length) || 0) *
                                (Number(watchedSubItems?.[index]?.breadth) || 0) *
                                (Number(watchedSubItems?.[index]?.depth) || 0)
                              ).toFixed(3)}{" "}
                              {unitSymbol}
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
                    <p className="text-2xl font-bold text-primary">{calculatedQuantity.toFixed(3)} {unitSymbol}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {/* Validation Status */}
                {!isFormValid && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                    <p className="text-amber-800 font-medium">⚠️ Form Requirements:</p>
                    <ul className="text-amber-700 list-disc list-inside mt-1 space-y-1">
                      {!form.watch("description").trim() && <li>Description is required</li>}
                      {!form.watch("unitId") && <li>Unit must be selected</li>}
                      {!form.watch("rate") && <li>Rate must be greater than 0</li>}
                      {!hasDirectSubItems && !hasHierarchicalStructure && <li>Select a work item structure</li>}
                      {calculatedQuantity <= 0 && <li>Total quantity must be greater than 0</li>}
                    </ul>
                  </div>
                )}
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
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting || !isFormValid}
                >
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
