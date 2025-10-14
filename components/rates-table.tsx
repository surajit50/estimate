"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash2, Search, Loader2, Plus } from "lucide-react"
import { AddRateDialog } from "@/components/add-rate-dialog"
import { EditRateDialog } from "@/components/edit-rate-dialog"
import { DeleteRateDialog } from "@/components/delete-rate-dialog"
import { createWorkItemsFromRates } from "@/lib/actions/work-items"

interface Rate {
  id: string
  description: string
  unitId: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  standardRate: number
  year: string | null
  createdAt: Date
  updatedAt: Date
}

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface EstimateOption {
  id: string
  title: string
  category: string
}

interface RatesTableProps {
  rates: Rate[]
  units: Unit[]
  estimates: EstimateOption[]
}

export function RatesTable({ rates: initialRates, units, estimates }: RatesTableProps) {
  const [rates, setRates] = useState(initialRates)
  const [searchQuery, setSearchQuery] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editRate, setEditRate] = useState<Rate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedRateIds, setSelectedRateIds] = useState<Set<string>>(new Set())
  const [addToEstimateOpen, setAddToEstimateOpen] = useState(false)
  const [targetEstimateId, setTargetEstimateId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectAllRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const filteredRates = rates.filter(
    (rate) =>
      rate.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rate.unit.unitName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAdd = (newRate: Rate) => {
    setRates([...rates, newRate].sort((a, b) => a.description.localeCompare(b.description)))
    setAddDialogOpen(false)
  }

  const handleEdit = (updatedRate: Rate) => {
    setRates(rates.map((r) => (r.id === updatedRate.id ? updatedRate : r)))
    setEditRate(null)
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/rates/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setRates(rates.filter((r) => r.id !== id))
      setDeleteId(null)
    }
  }

  const isAllSelected = filteredRates.length > 0 && filteredRates.every((r) => selectedRateIds.has(r.id))
  const isIndeterminate = selectedRateIds.size > 0 && !isAllSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRateIds(new Set(filteredRates.map((r) => r.id)))
    } else {
      setSelectedRateIds(new Set())
    }
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedRateIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedRateIds(next)
  }

  const handleAddSelectedToEstimate = async () => {
    try {
      setIsSubmitting(true)
      const qty = parseFloat(quantity)
      const result = await createWorkItemsFromRates({
        estimateId: targetEstimateId,
        rateIds: Array.from(selectedRateIds),
        quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
      })
      if (!result.success) {
        throw new Error(result.error || "Failed to add to estimate")
      }
      setAddToEstimateOpen(false)
      setSelectedRateIds(new Set())
      setTargetEstimateId("")
      setQuantity("1")
      const redirectId = (Array.isArray(result.data) && result.data.length > 0) ? result.data[0].estimateId : targetEstimateId
      if (redirectId) router.push(`/estimates/${redirectId}/work-items`)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Rate Library</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage standard rates for work items</p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedRateIds.size > 0 ? `${selectedRateIds.size} selected` : ""}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedRateIds.size === 0 || estimates.length === 0}
                onClick={() => setAddToEstimateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Estimate
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    ref={selectAllRef}
                    checked={isAllSelected}
                    onCheckedChange={(c) => toggleSelectAll(Boolean(c))}
                    data-select-all
                  />
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Standard Rate (₹)</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No rates found. Add your first rate to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRateIds.has(rate.id)}
                        onCheckedChange={(c) => toggleSelectOne(rate.id, Boolean(c))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{rate.description}</TableCell>
                    <TableCell>{rate.unit.unitSymbol}</TableCell>
                    <TableCell>₹{rate.standardRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{rate.year || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditRate(rate)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(rate.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddRateDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAdd} units={units} />
      <EditRateDialog
        rate={editRate}
        onOpenChange={(open) => !open && setEditRate(null)}
        onEdit={handleEdit}
        units={units}
      />
      <DeleteRateDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />

      <Dialog open={addToEstimateOpen} onOpenChange={setAddToEstimateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add selected rates to estimate</DialogTitle>
            <DialogDescription>
              Create work items in a chosen estimate from the selected rate library entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estimate</Label>
              <Select value={targetEstimateId} onValueChange={setTargetEstimateId}>
                <SelectTrigger>
                  <SelectValue placeholder={estimates.length ? "Select an estimate" : "No estimates available"} />
                </SelectTrigger>
                <SelectContent>
                  {estimates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-muted-foreground">{e.category}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity for each item</Label>
              <Input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToEstimateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelectedToEstimate}
              disabled={isSubmitting || !targetEstimateId || selectedRateIds.size === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? "Adding..." : `Add ${selectedRateIds.size} item${selectedRateIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
