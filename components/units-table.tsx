"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { AddUnitDialog } from "@/components/add-unit-dialog"
import { EditUnitDialog } from "@/components/edit-unit-dialog"
import { DeleteUnitDialog } from "@/components/delete-unit-dialog"

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
  createdAt: Date
}

interface UnitsTableProps {
  units: Unit[]
}

export function UnitsTable({ units: initialUnits }: UnitsTableProps) {
  const [units, setUnits] = useState(initialUnits)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editUnit, setEditUnit] = useState<Unit | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleAdd = (newUnit: Unit) => {
    setUnits([...units, newUnit].sort((a, b) => a.unitName.localeCompare(b.unitName)))
    setAddDialogOpen(false)
  }

  const handleEdit = (updatedUnit: Unit) => {
    setUnits(units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)))
    setEditUnit(null)
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/units/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setUnits(units.filter((u) => u.id !== id))
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Unit Master</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage measurement units for work items</p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unitName}</TableCell>
                  <TableCell>{unit.unitSymbol}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditUnit(unit)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(unit.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddUnitDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAdd} />
      <EditUnitDialog unit={editUnit} onOpenChange={(open) => !open && setEditUnit(null)} onEdit={handleEdit} />
      <DeleteUnitDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </>
  )
}
