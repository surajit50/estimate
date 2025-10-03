"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WorkItemsTable } from "@/components/work-items-table"

interface SubItem {
  id: string
  description: string
  nos: number
  length: number
  breadth: number
  depth: number
  quantity: number
}

interface WorkItem {
  id: string
  itemNo: number
  pageRef: string | null
  itemRef: string | null
  description: string
  unitId: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  rate: number
  length: number
  width: number
  height: number
  quantity: number
  amount: number
  subItems?: SubItem[]
}

interface Estimate {
  id: string
  title: string
  category: string
  description: string | null
  location: string | null
  workItems: WorkItem[]
}

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

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
}

interface WorkItemsManagerProps {
  estimate: Estimate
  units: Unit[]
  rates: Rate[]
}

export function WorkItemsManager({ estimate, units, rates }: WorkItemsManagerProps) {
  const [workItems, setWorkItems] = useState(estimate.workItems)

  const handleAdd = (newItem: WorkItem) => {
    setWorkItems([...workItems, newItem])
  }

  const handleUpdate = (updatedItem: WorkItem) => {
    setWorkItems(workItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  const handleDelete = (id: string) => {
    setWorkItems(workItems.filter((item) => item.id !== id))
  }

  const totalAmount = workItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{estimate.title}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{estimate.category}</Badge>
                {estimate.location && <Badge variant="outline">{estimate.location}</Badge>}
              </div>
              {estimate.description && <p className="text-sm text-muted-foreground mt-2">{estimate.description}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Estimate</p>
              <p className="text-2xl font-bold">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <WorkItemsTable
        estimateId={estimate.id}
        workItems={workItems}
        units={units}
        rates={rates}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  )
}
