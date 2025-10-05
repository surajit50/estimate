"use client"

import type React from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForm, useFieldArray } from "react-hook-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { WorkItemWithUnit, UnitMasterType, RateLibraryType } from "@/lib/types"

interface WorkItemForm {
  name: string
  rate: number
  unitId: string
  subItems: { name: string; length?: number; breadth?: number; depth?: number; nos?: number }[]
  subCategories: {
    name: string
    subItems: { name: string; length?: number; breadth?: number; depth?: number; nos?: number }[]
  }[]
}

interface AddWorkItemDialogProps {
  open: boolean
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>
  onAdd: (item: WorkItemWithUnit) => void
  estimateId: string
  units: UnitMasterType[]
  rates: RateLibraryType[]
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
  const [mode, setMode] = useState<"direct" | "hierarchical">("direct")

  const form = useForm<WorkItemForm>({
    defaultValues: { name: "", rate: 0, unitId: "", subItems: [], subCategories: [] },
  })

  const {
    fields: subItemFields,
    append: appendSubItem,
  } = useFieldArray({ control: form.control, name: "subItems" })

  const {
    fields: categoryFields,
    append: appendCategory,
  } = useFieldArray({ control: form.control, name: "subCategories" })

  // unit-aware quantity calculation (includes nos factor where appropriate)
  const calculateQuantity = (item: any, unitSymbol: string) => {
    const l = Number(item.length) || 0
    const b = Number(item.breadth) || 0
    const d = Number(item.depth) || 0
    const n = Number(item.nos) || 0

    switch (unitSymbol) {
      case "nos":
        return n
      case "m":
        return n * l
      case "m2":
        return n * l * b
      case "m3":
        return n * l * b * d
      case "kg":
      case "bag":
      case "mt":
        return n
      default: {
        const hasAnyDim = l > 0 || b > 0 || d > 0
        const dims = (l || 1) * (b || 1) * (d || 1)
        return hasAnyDim ? (n > 0 ? n * dims : dims) : n
      }
    }
  }

  const unitId = form.watch("unitId")
  const rate = form.watch("rate")
  const subItems = form.watch("subItems")
  const subCategories = form.watch("subCategories")

  const selectedUnitSymbol = units.find((u) => u.id === unitId)?.unitSymbol ?? ""

  const totalQuantity =
    (subItems?.reduce((sum, si) => sum + calculateQuantity(si, selectedUnitSymbol), 0) || 0) +
    (subCategories?.reduce(
      (sum, cat) =>
        sum + (cat.subItems?.reduce((s, si) => s + calculateQuantity(si, selectedUnitSymbol), 0) || 0),
      0
    ) || 0)

  const totalAmount = totalQuantity * (rate || 0)

  const onSubmit = async (data: WorkItemForm) => {
    const payload = {
      estimateId,
      itemNo: nextItemNo,
      pageRef: null,
      description: data.name,
      unitId: data.unitId,
      rate: data.rate,
      quantity: totalQuantity,
      amount: totalAmount,
      subItems: (data.subItems || []).map((si) => ({
        description: si.name,
        nos: si.nos ?? 0,
        length: si.length ?? 0,
        breadth: si.breadth ?? 0,
        depth: si.depth ?? 0,
        unitSymbol: selectedUnitSymbol,
      })),
      subCategories: (data.subCategories || []).map((cat) => ({
        categoryName: cat.name,
        description: null,
        subItems: (cat.subItems || []).map((si) => ({
          description: si.name,
          nos: si.nos ?? 0,
          length: si.length ?? 0,
          breadth: si.breadth ?? 0,
          depth: si.depth ?? 0,
          unitSymbol: selectedUnitSymbol,
        })),
      })),
    }

    const response = await fetch("/api/work-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const created: WorkItemWithUnit = await response.json()
      onAdd(created)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Work Item</DialogTitle>
            <DialogDescription>Create a new work item with details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input {...form.register("name", { required: true })} />
            </div>
            <div>
              <Label>Rate Library</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {rate ? `${rate}` : "Select Rate"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search rate..." />
                    <CommandEmpty>No rate found.</CommandEmpty>
                    <CommandGroup>
                      {rates?.map((r) => (
                        <CommandItem
                          key={r.id}
                          onSelect={() => {
                            form.setValue("rate", r.standardRate)
                            form.setValue("unitId", r.unitId)
                          }}
                        >
                          {r.description} ({r.unit.unitSymbol}) - {r.standardRate}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Unit</Label>
              <select {...form.register("unitId")}>
                <option value="">Select Unit</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.id}>{u.unitName}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant={mode === "direct" ? "default" : "outline"} onClick={() => setMode("direct")}>Direct Sub-Items</Button>
              <Button type="button" variant={mode === "hierarchical" ? "default" : "outline"} onClick={() => setMode("hierarchical")}>Hierarchical Structure</Button>
            </div>

            {mode === "direct" && (
              <div>
                <Label>Sub Items</Label>
                <ScrollArea className="h-48 border p-2">
                  {subItemFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 mb-2">
                      <Input placeholder="Name" {...form.register(`subItems.${index}.name`)} />
                      <Input type="number" placeholder="Nos" {...form.register(`subItems.${index}.nos`)} />
                      <Input type="number" placeholder="Length" {...form.register(`subItems.${index}.length`)} />
                      <Input type="number" placeholder="Breadth" {...form.register(`subItems.${index}.breadth`)} />
                      <Input type="number" placeholder="Depth" {...form.register(`subItems.${index}.depth`)} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendSubItem({ name: "", nos: 0, length: 0, breadth: 0, depth: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Sub Item</Button>
                </ScrollArea>
              </div>
            )}

            {mode === "hierarchical" && (
              <div>
                <Label>Sub Categories</Label>
                {categoryFields.map((cat, catIndex) => {
                  const { fields: catSubItems, append: appendCatSubItem } = useFieldArray({ control: form.control, name: `subCategories.${catIndex}.subItems` })
                  return (
                    <div key={cat.id} className="border p-2 mb-2">
                      <Input placeholder="Category Name" {...form.register(`subCategories.${catIndex}.name`)} />
                      {catSubItems.map((field, siIndex) => (
                        <div key={field.id} className="flex gap-2 mb-2">
                          <Input placeholder="Name" {...form.register(`subCategories.${catIndex}.subItems.${siIndex}.name`)} />
                          <Input type="number" placeholder="Nos" {...form.register(`subCategories.${catIndex}.subItems.${siIndex}.nos`)} />
                          <Input type="number" placeholder="Length" {...form.register(`subCategories.${catIndex}.subItems.${siIndex}.length`)} />
                          <Input type="number" placeholder="Breadth" {...form.register(`subCategories.${catIndex}.subItems.${siIndex}.breadth`)} />
                          <Input type="number" placeholder="Depth" {...form.register(`subCategories.${catIndex}.subItems.${siIndex}.depth`)} />
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendCatSubItem({ name: "", nos: 0, length: 0, breadth: 0, depth: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Sub Item</Button>
                    </div>
                  )
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => appendCategory({ name: "", subItems: [] })}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
              </div>
            )}

            <div>
              <p>Total Quantity: {totalQuantity.toFixed(3)} {selectedUnitSymbol}</p>
              <p>
                Total Amount: {Number(totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
