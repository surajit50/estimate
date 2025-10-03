"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit, Trash2, Search } from "lucide-react"
import { AddRateDialog } from "@/components/add-rate-dialog"
import { EditRateDialog } from "@/components/edit-rate-dialog"
import { DeleteRateDialog } from "@/components/delete-rate-dialog"

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

interface RatesTableProps {
  rates: Rate[]
  units: Unit[]
}

export function RatesTable({ rates: initialRates, units }: RatesTableProps) {
  const [rates, setRates] = useState(initialRates)
  const [searchQuery, setSearchQuery] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editRate, setEditRate] = useState<Rate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No rates found. Add your first rate to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRates.map((rate) => (
                  <TableRow key={rate.id}>
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
    </>
  )
}
