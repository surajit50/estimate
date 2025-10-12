"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DraggableWorkItemsTable } from "@/components/draggable-work-items-table"
import { updateWorkItem } from "@/lib/actions/work-items"
import type { EstimateWithItems, UnitMasterType, RateLibraryType, WorkItemWithUnit } from "@/lib/types"

interface WorkItemsManagerProps {
  estimate: EstimateWithItems
  units: UnitMasterType[]
  rates: RateLibraryType[]
}

export function WorkItemsManager({ estimate, units, rates }: WorkItemsManagerProps) {
  const [workItems, setWorkItems] = useState<WorkItemWithUnit[]>(estimate.workItems)

  const handleAdd = (newItem: WorkItemWithUnit) => {
    setWorkItems([...workItems, newItem])
  }

  const handleBulkAdd = (newItems: WorkItemWithUnit[]) => {
    setWorkItems([...workItems, ...newItems])
  }

  const handleUpdate = (updatedItem: WorkItemWithUnit) => {
    setWorkItems(workItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  const handleDelete = (id: string) => {
    setWorkItems(workItems.filter((item) => item.id !== id))
  }

  const handleReorder = async (reorderedItems: WorkItemWithUnit[]) => {
    // Update local state immediately for better UX
    setWorkItems(reorderedItems)
    
    // Update item numbers in the database
    try {
      const updatePromises = reorderedItems.map((item, index) => {
        const newItemNo = index + 1
        if (item.itemNo !== newItemNo) {
          return updateWorkItem(item.id, { itemNo: newItemNo })
        }
        return Promise.resolve()
      })
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Error updating item order:", error)
      // Revert on error
      setWorkItems(workItems)
    }
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

      <DraggableWorkItemsTable
        estimateId={estimate.id}
        workItems={workItems}
        units={units}
        rates={rates}
        onAdd={handleAdd}
        onBulkAdd={handleBulkAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />
    </div>
  )
}
