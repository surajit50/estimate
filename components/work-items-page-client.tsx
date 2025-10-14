"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Save, 
  X, 
  Edit, 
  Trash2, 
  Check, 
  Loader2, 
  Calculator,
  Package,
  Users,
  Wrench,
  TrendingUp,
  AlertCircle,
  Search,
  Filter,
  Download
} from "lucide-react"
import { createWorkItem, updateWorkItem, deleteWorkItem, createWorkItemsFromDatabase, createWorkItemsFromRateLibrary } from "@/lib/actions/work-items"
import { freezeEstimate, unfreezeEstimate } from "@/lib/actions/estimates"
import { EditWorkItemDialog } from "@/components/edit-work-item-dialog"
import type { EstimateWithItems, UnitMasterType, RateLibraryType, WorkItemWithUnit } from "@/lib/types"

interface WorkItemsPageClientProps {
  estimate: EstimateWithItems
  units: UnitMasterType[]
  rates: RateLibraryType[]
  allWorkItems: any[]
}

interface NewWorkItemForm {
  description: string
  unitId: string
  rate: number
  quantity: number
  length: number
  width: number
  height: number
  materialCost: number
  laborCost: number
  equipmentCost: number
  overheadCost: number
  discount: number
  profitMargin: number
  notes: string
  pageRef: string
}

export function WorkItemsPageClient({ estimate, units, rates, allWorkItems }: WorkItemsPageClientProps) {
  const [workItems, setWorkItems] = useState<WorkItemWithUnit[]>(estimate.workItems)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showRateSelection, setShowRateSelection] = useState(false)
  const [selectedRateIds, setSelectedRateIds] = useState<string[]>([])
  const [isFrozen, setIsFrozen] = useState<boolean>(!!(estimate as any).isFrozen)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("items")
  
  const [newItem, setNewItem] = useState<NewWorkItemForm>({
    description: "",
    unitId: "",
    rate: 0,
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    materialCost: 0,
    laborCost: 0,
    equipmentCost: 0,
    overheadCost: 0,
    discount: 0,
    profitMargin: 10,
    notes: "",
    pageRef: ""
  })

  const formRef = useRef<HTMLFormElement>(null)

  // Calculate totals
  const totalAmount = workItems.reduce((sum, item) => sum + item.amount, 0)
  const totalMaterialCost = workItems.reduce((sum, item) => sum + (item.materialCost || 0), 0)
  const totalLaborCost = workItems.reduce((sum, item) => sum + (item.laborCost || 0), 0)
  const totalEquipmentCost = workItems.reduce((sum, item) => sum + (item.equipmentCost || 0), 0)
  const totalOverheadCost = workItems.reduce((sum, item) => sum + (item.overheadCost || 0), 0)

  const nextItemNo = workItems.length > 0 ? Math.max(...workItems.map(item => item.itemNo)) + 1 : 1

  // Filter work items based on search
  const filteredWorkItems = workItems.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pageRef?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAreaUnit = (unitSymbol: string) => {
    const s = unitSymbol.trim().toLowerCase()
    return s === "m2" || s === "m²" || s === "sqm" || s === "sq m" || s === "sq. m"
  }

  const isVolumeUnit = (unitSymbol: string) => {
    const s = unitSymbol.trim().toLowerCase()
    return s === "m3" || s === "m³" || s === "cum" || s === "cu m" || s === "cu. m"
  }

  const computeQuantityForUnit = (item: { unitId: string; length: number; width: number; height: number; quantity: number; }) => {
    const unit = units.find(u => u.id === item.unitId)
    const unitSymbol = unit?.unitSymbol || ""
    if (isAreaUnit(unitSymbol)) {
      return (item.length || 0) * (item.width || 0)
    }
    if (isVolumeUnit(unitSymbol)) {
      return (item.length || 0) * (item.width || 0) * (item.height || 0)
    }
    return item.quantity || 0
  }

  const calculateAmount = (item: NewWorkItemForm) => {
    const calculatedQuantity = computeQuantityForUnit(item)
    const baseAmount = calculatedQuantity * item.rate
    const discountAmount = (baseAmount * item.discount) / 100
    const profitAmount = ((baseAmount - discountAmount) * item.profitMargin) / 100
    return baseAmount - discountAmount + profitAmount
  }

  const handleAddItem = async () => {
    if (isFrozen) {
      
      return
    }
    
    if (!newItem.description || !newItem.unitId || newItem.rate <= 0) {
      
      return
    }

    setIsSaving(true)
    try {
      const amount = calculateAmount(newItem)
      const calculatedQuantity = computeQuantityForUnit(newItem)
      
      const result = await createWorkItem({
        estimateId: estimate.id,
        itemNo: nextItemNo,
        description: newItem.description,
        unitId: newItem.unitId,
        rate: newItem.rate,
        quantity: calculatedQuantity,
        length: newItem.length,
        width: newItem.width,
        height: newItem.height,
        amount: amount,
        materialCost: newItem.materialCost,
        laborCost: newItem.laborCost,
        equipmentCost: newItem.equipmentCost,
        overheadCost: newItem.overheadCost,
        discount: newItem.discount,
        profitMargin: newItem.profitMargin,
        notes: newItem.notes,
        pageRef: newItem.pageRef
      })

      if (result.success && result.data) {
        setWorkItems([...workItems, result.data])
        setNewItem({
          description: "",
          unitId: "",
          rate: 0,
          quantity: 0,
          length: 0,
          width: 0,
          height: 0,
          materialCost: 0,
          laborCost: 0,
          equipmentCost: 0,
          overheadCost: 0,
          discount: 0,
          profitMargin: 10,
          notes: "",
          pageRef: ""
        })
        setIsAddingItem(false)
        formRef.current?.reset()
        
        
      } else {
        throw new Error(result.error || "Failed to add item")
      }
    } catch (error) {
      console.error("Error adding work item:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateItem = async (itemId: string, updates: Partial<WorkItemWithUnit>) => {
    if (isFrozen) {
      
      return
    }
    
    setIsUpdating(itemId)
    try {
      const result = await updateWorkItem(itemId, updates)
      if (result.success && result.data) {
        setWorkItems(workItems.map(item => 
          item.id === itemId ? result.data! as unknown as WorkItemWithUnit : item
        ))
        setEditingItem(null)
        
      } else {
        throw new Error(result.error || "Failed to update item")
      }
    } catch (error) {
      console.error("Error updating work item:", error)
      
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (isFrozen) {
      
      return
    }
    
    setIsDeleting(itemId)
    try {
      const result = await deleteWorkItem(itemId)
      if (result.success) {
        setWorkItems(workItems.filter(item => item.id !== itemId))
        
      } else {
        throw new Error(result.error || "Failed to delete item")
      }
    } catch (error) {
      console.error("Error deleting work item:", error)
      
    } finally {
      setIsDeleting(null)
    }
  }

  const getUnitSymbol = (unitId: string) => {
    return units.find(u => u.id === unitId)?.unitSymbol || ""
  }

  const getCalculatedQuantity = (item: WorkItemWithUnit) => {
    return computeQuantityForUnit({
      unitId: item.unitId,
      length: item.length,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
    })
  }

  // Keep quantity in sync for computed units while editing the new item form
  useEffect(() => {
    if (!newItem.unitId) return
    const unit = units.find(u => u.id === newItem.unitId)
    const unitSymbol = unit?.unitSymbol || ""
    if (isAreaUnit(unitSymbol) || isVolumeUnit(unitSymbol)) {
      const q = computeQuantityForUnit(newItem)
      if (q !== newItem.quantity) {
        setNewItem({ ...newItem, quantity: q })
      }
    }
  }, [newItem.unitId, newItem.length, newItem.width, newItem.height])

  const handleAddFromRates = async () => {
    if (isFrozen) {
      
      return
    }
    
    if (selectedRateIds.length === 0) {
      
      return
    }

    setIsSaving(true)
    try {
      const result = await createWorkItemsFromRateLibrary({
        estimateId: estimate.id,
        rateIds: selectedRateIds,
      })

      if (result.success && result.data) {
        // Refresh the page to show updated data
        window.location.reload()
        
      } else {
        throw new Error(result.error || "Failed to add items")
      }

      setSelectedRateIds([])
      setShowRateSelection(false)
    } catch (error) {
      console.error("Error adding items from rate library:", error)
      
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Status and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Items</h1>
          <p className="text-muted-foreground">
            Manage work items for estimate #{estimate.estimateNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFrozen && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              Finalized
            </Badge>
          )}
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {isFrozen ? (
            <Button
              variant="outline"
              onClick={async () => {
                const res = await unfreezeEstimate(estimate.id)
                if (res.success) {
                  setIsFrozen(false)
                  
                }
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Unfreeze Estimate
            </Button>
          ) : (
            <Button
              onClick={async () => {
                const res = await freezeEstimate(estimate.id)
                if (res.success) {
                  setIsFrozen(true)
                
                }
              }}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Finalize Estimate
            </Button>
          )}
        </div>
      </div>

      {isFrozen && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This estimate has been finalized. No modifications are allowed unless unfrozen.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards - Improved Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Calculator className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Material Cost</p>
                <p className="text-xl font-semibold">₹{totalMaterialCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Labor Cost</p>
                <p className="text-xl font-semibold">₹{totalLaborCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equipment Cost</p>
                <p className="text-xl font-semibold">₹{totalEquipmentCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overhead Cost</p>
                <p className="text-xl font-semibold">₹{totalOverheadCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Work Items ({workItems.length})
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Items
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2">
            <Package className="h-4 w-4" />
            Rate Library
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Cost Analysis
          </TabsTrigger>
        </TabsList>

        {/* Work Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Work Items</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="pl-9 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredWorkItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? "No matching items found" : "No work items yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Start by adding your first work item"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setActiveTab("add")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead className="min-w-[200px]">Description</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-24 text-right">Qty</TableHead>
                        <TableHead className="w-24 text-right">Rate</TableHead>
                        <TableHead className="w-24 text-right">Amount</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorkItems.map((item) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="font-medium">{item.itemNo}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium line-clamp-2">{item.description}</div>
                              {(item.pageRef || item.notes) && (
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                  {item.pageRef && <div>Ref: {item.pageRef}</div>}
                                  {item.notes && <div className="line-clamp-1">{item.notes}</div>}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {getUnitSymbol(item.unitId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {getCalculatedQuantity(item).toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.rate.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium font-mono">
                            ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingItem(item.id)}
                                disabled={isFrozen || isUpdating === item.id}
                              >
                                {isUpdating === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isFrozen || isDeleting === item.id}
                              >
                                {isDeleting === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={5} className="text-right">
                          Total Estimate:
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Items Tab */}
        <TabsContent value="add" className="space-y-6">
          {/* Quick Add Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Add Work Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={formRef} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter work item description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pageRef">Page Reference</Label>
                    <Input
                      id="pageRef"
                      placeholder="e.g., 1/2 a, 332/18.07"
                      value={newItem.pageRef}
                      onChange={(e) => setNewItem({ ...newItem, pageRef: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={newItem.unitId} onValueChange={(value) => setNewItem({ ...newItem, unitId: value })}>
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate (₹) *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItem.rate || ""}
                      onChange={(e) => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.001"
                      placeholder="Auto-calculated"
                      value={newItem.quantity || ""}
                      disabled={(() => {
                        const unit = units.find(u => u.id === newItem.unitId)
                        const s = unit?.unitSymbol || ""
                        return isAreaUnit(s) || isVolumeUnit(s)
                      })()}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profitMargin">Profit (%)</Label>
                    <Input
                      id="profitMargin"
                      type="number"
                      step="0.01"
                      placeholder="10.00"
                      value={newItem.profitMargin || ""}
                      onChange={(e) => setNewItem({ ...newItem, profitMargin: parseFloat(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                {/* Amount Preview */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Calculated Amount:</span>
                    <span className="text-lg font-bold text-blue-900">
                      ₹{calculateAmount(newItem).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewItem({
                        description: "",
                        unitId: "",
                        rate: 0,
                        quantity: 0,
                        length: 0,
                        width: 0,
                        height: 0,
                        materialCost: 0,
                        laborCost: 0,
                        equipmentCost: 0,
                        overheadCost: 0,
                        discount: 0,
                        profitMargin: 10,
                        notes: "",
                        pageRef: ""
                      })
                      formRef.current?.reset()
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isFrozen || isSaving || !newItem.description || !newItem.unitId || newItem.rate <= 0}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Library Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Rate Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Select standard items from the rate library to add to this estimate.
                  </p>
                  {selectedRateIds.length > 0 && (
                    <Button
                      onClick={handleAddFromRates}
                      disabled={isSaving || isFrozen}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {isSaving ? "Adding..." : `Add ${selectedRateIds.length} Item(s)`}
                    </Button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Standard Rate (₹)</TableHead>
                        <TableHead className="text-right">Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.length > 0 ? (
                        rates.map((rate) => (
                          <TableRow key={rate.id} className="group">
                            <TableCell>
                              <Checkbox
                                checked={selectedRateIds.includes(rate.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRateIds([...selectedRateIds, rate.id])
                                  } else {
                                    setSelectedRateIds(selectedRateIds.filter(id => id !== rate.id))
                                  }
                                }}
                                disabled={isFrozen}
                              />
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <div className="font-medium group-hover:text-primary transition-colors">
                                {rate.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {rate.unit.unitSymbol}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {rate.standardRate.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {rate.year || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 text-muted-foreground/50" />
                              <p>No rates found in library</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {selectedRateIds.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedRateIds.length} item(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRateIds([])}
                        disabled={isFrozen}
                        size="sm"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cost Breakdown Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Cost Distribution</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Material", value: totalMaterialCost, color: "bg-blue-500" },
                      { label: "Labor", value: totalLaborCost, color: "bg-green-500" },
                      { label: "Equipment", value: totalEquipmentCost, color: "bg-orange-500" },
                      { label: "Overhead", value: totalOverheadCost, color: "bg-purple-500" },
                    ].map((item, index) => {
                      const percentage = totalAmount > 0 ? (item.value / totalAmount) * 100 : 0
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.label}</span>
                            <span>₹{item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Total Direct Costs</span>
                      <span className="font-medium">₹{(totalMaterialCost + totalLaborCost + totalEquipmentCost).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Overhead Costs</span>
                      <span className="font-medium">₹{totalOverheadCost.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="font-semibold">Total Estimate</span>
                      <span className="font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Work Item Dialog */}
      <EditWorkItemDialog
        item={workItems.find(w => w.id === editingItem) ?? null}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null)
        }}
        onEdit={(updated) => {
          setWorkItems(workItems.map(w => (w.id === updated.id ? updated : w)))
          setEditingItem(null)
        }}
        units={units}
        rates={rates}
      />
    </div>
  )
}
