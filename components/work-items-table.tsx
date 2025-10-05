"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { AddWorkItemDialog } from "@/components/add-work-item-dialog"
import type { WorkItemWithUnit, UnitMasterType, RateLibraryType, SubCategoryType, SubWorkItemType } from "@/lib/types"

interface WorkItemsTableProps {
  estimateId: string
  workItems: WorkItemWithUnit[]
  units: UnitMasterType[]
  rates: RateLibraryType[]
  onAdd: (item: WorkItemWithUnit) => void
  onUpdate: (item: WorkItemWithUnit) => void
  onDelete: (id: string) => void
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v)
}

function unitSymbolForItem(wi: WorkItemWithUnit, units: UnitMasterType[]) {
  return wi.unit?.unitSymbol ?? units.find((u) => u.id === wi.unitId)?.unitSymbol ?? ""
}

function qtyFromSubItems(subItems?: SubWorkItemType[]) {
  return (subItems ?? []).reduce((acc, s) => acc + (isNumber(s.quantity) ? s.quantity : 0), 0)
}

function qtyFromSubCategories(subCategories?: SubCategoryType[]) {
  return (subCategories ?? []).reduce((acc, c) => acc + qtyFromSubItems(c.subItems), 0)
}

function deriveQuantity(wi: WorkItemWithUnit): number {
  if (isNumber(wi.quantity) && wi.quantity > 0) return wi.quantity
  const q1 = qtyFromSubItems(wi.subItems)
  const q2 = qtyFromSubCategories(wi.subCategories)
  const total = q1 + q2
  return isNumber(total) && total > 0 ? total : 0
}

function deriveAmount(wi: WorkItemWithUnit, qty: number): number {
  if (isNumber(wi.amount)) return wi.amount
  const rate = isNumber(wi.rate) ? wi.rate : 0
  return qty * rate
}

export function WorkItemsTable({ estimateId, workItems, units, rates, onAdd, onDelete }: WorkItemsTableProps) {
  const [open, setOpen] = React.useState(false)

  const nextItemNo = React.useMemo(() => {
    const maxNo = workItems.reduce((m, wi) => Math.max(m, wi.itemNo ?? 0), 0)
    return maxNo + 1
  }, [workItems])

  return (
    <div className="bg-white border rounded-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Work Items</h3>
          <p className="text-sm text-muted-foreground">Manage items, quantities, and amounts</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Work Item
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Item No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Unit</TableHead>
              <TableHead className="w-[140px] text-right">Quantity</TableHead>
              <TableHead className="w-[120px] text-right">Rate (₹)</TableHead>
              <TableHead className="w-[160px] text-right">Amount (₹)</TableHead>
              <TableHead className="w-[90px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No work items yet. Click "Add Work Item" to create one.
                </TableCell>
              </TableRow>
            ) : (
              workItems.map((wi) => {
                const symbol = unitSymbolForItem(wi, units)
                const displayQty = deriveQuantity(wi)
                const displayAmount = deriveAmount(wi, displayQty)

                return (
                  <TableRow key={wi.id}>
                    <TableCell>{wi.itemNo}</TableCell>
                    <TableCell className="max-w-[520px]">
                      <div className="font-medium">{wi.description}</div>
                      {wi.pageRef ? <div className="text-xs text-muted-foreground mt-1">Ref: {wi.pageRef}</div> : null}
                    </TableCell>
                    <TableCell>{symbol}</TableCell>
                    <TableCell className="text-right">{displayQty.toFixed(3)}</TableCell>
                    <TableCell className="text-right">
                      {(wi.rate ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {displayAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete item ${wi.itemNo}`}
                        onClick={() => onDelete(wi.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <AddWorkItemDialog
        open={open}
        onOpenChange={setOpen}
        onAdd={(newItem: any) => {
          const topQty = typeof newItem.quantity === "number" && newItem.quantity > 0 ? newItem.quantity : 0
          const nestedQty = qtyFromSubItems(newItem?.subItems) + qtyFromSubCategories(newItem?.subCategories)
          const qty = topQty > 0 ? topQty : nestedQty

          const rate = typeof newItem.rate === "number" ? newItem.rate : 0
          const amount = typeof newItem.amount === "number" ? newItem.amount : qty * rate

          onAdd({ ...newItem, quantity: qty, amount })
        }}
        estimateId={estimateId}
        units={units}
        rates={rates}
        nextItemNo={nextItemNo}
      />
    </div>
  )
}
