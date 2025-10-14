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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  CheckIcon,
  ChevronsUpDown
} from "lucide-react"
import { createWorkItem, updateWorkItem, deleteWorkItem, createWorkItemsFromDatabase } from "@/lib/actions/work-items"
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
  selectedRateId: string
}

export function WorkItemsPageClient({ estimate, units, rates, allWorkItems }: WorkItemsPageClientProps) {
  const [workItems, setWorkItems] = useState<WorkItemWithUnit[]>(estimate.workItems)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showDatabaseSelection, setShowDatabaseSelection] = useState(false)
  const [selectedDatabaseItems, setSelectedDatabaseItems] = useState<string[]>([])
  const [isRateSelectorOpen, setIsRateSelectorOpen] = useState(false)
  const [rateSearchValue, setRateSearchValue] = useState("")
  
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
    pageRef: "",
    selectedRateId: ""
  })

  const formRef = useRef<HTMLFormElement>(null)

  // Calculate totals
  const totalAmount = workItems.reduce((sum, item) => sum + item.amount, 0)
  const totalMaterialCost = workItems.reduce((sum, item) => sum + (item.materialCost || 0), 0)
  const totalLaborCost = workItems.reduce((sum, item) => sum + (item.laborCost || 0), 0)
  const totalEquipmentCost = workItems.reduce((sum, item) => sum + (item.equipmentCost || 0), 0)
  const totalOverheadCost = workItems.reduce((sum, item) => sum + (item.overheadCost || 0), 0)

  const nextItemNo = workItems.length > 0 ? Math.max(...workItems.map(item => item.itemNo)) + 1 : 1

  // Filter rates based on search
  const filteredRates = rates.filter(rate => 
    rate.description.toLowerCase().includes(rateSearchValue.toLowerCase()) ||
    rate.unit.unitSymbol.toLowerCase().includes(rateSearchValue.toLowerCase())
  )

  // Get selected rate details
  const selectedRate = rates.find(rate => rate.id === newItem.selectedRateId)

  // Handle rate selection
  const handleRateSelect = (rateId: string) => {
    const rate = rates.find(r => r.id === rateId)
    if (rate) {
      setNewItem({
        ...newItem,
        selectedRateId: rateId,
        description: rate.description,
        unitId: rate.unitId,
        rate: rate.standardRate
      })
      setIsRateSelectorOpen(false)
      setRateSearchValue("")
    }
  }

  // Reset form
  const resetForm = () => {
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
      pageRef: "",
      selectedRateId: ""
    })
    setRateSearchValue("")
    setIsRateSelectorOpen(false)
  }

  const calculateAmount = (item: NewWorkItemForm) => {
    const unit = units.find(u => u.id === item.unitId)
    const unitSymbol = unit?.unitSymbol?.toLowerCase() || ""
    
    let calculatedQuantity = item.quantity
    
    // Calculate quantity based on unit type
    if (unitSymbol === "m2" || unitSymbol === "m²") {
      calculatedQuantity = item.length * item.width
    } else if (unitSymbol === "m3" || unitSymbol === "m³") {
      calculatedQuantity = item.length * item.width * item.height
    }
    
    const baseAmount = calculatedQuantity * item.rate
    const discountAmount = (baseAmount * item.discount) / 100
    const profitAmount = ((baseAmount - discountAmount) * item.profitMargin) / 100
    
    return baseAmount - discountAmount + profitAmount
  }

  const handleAddItem = async () => {
    if (!newItem.description || !newItem.unitId || newItem.rate <= 0) {
      return
    }

    setIsSaving(true)
    try {
      const amount = calculateAmount(newItem)
      
      const result = await createWorkItem({
        estimateId: estimate.id,
        itemNo: nextItemNo,
        description: newItem.description,
        unitId: newItem.unitId,
        rate: newItem.rate,
        quantity: newItem.quantity,
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
        resetForm()
        setIsAddingItem(false)
        formRef.current?.reset()
      }
    } catch (error) {
      console.error("Error adding work item:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateItem = async (itemId: string, updates: Partial<WorkItemWithUnit>) => {
    setIsUpdating(itemId)
    try {
      const result = await updateWorkItem(itemId, updates)
      if (result.success && result.data) {
        setWorkItems(workItems.map(item => 
          item.id === itemId ? result.data! as unknown as WorkItemWithUnit : item
        ))
        setEditingItem(null)
      }
    } catch (error) {
      console.error("Error updating work item:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(itemId)
    try {
      const result = await deleteWorkItem(itemId)
      if (result.success) {
        setWorkItems(workItems.filter(item => item.id !== itemId))
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
    const unit = units.find(u => u.id === item.unitId)
    const unitSymbol = unit?.unitSymbol?.toLowerCase() || ""
    
    if (unitSymbol === "m2" || unitSymbol === "m²") {
      return (item.length || 0) * (item.width || 0)
    } else if (unitSymbol === "m3" || unitSymbol === "m³") {
      return (item.length || 0) * (item.width || 0) * (item.height || 0)
    }
    
    return item.quantity || 0
  }

  const handleAddFromDatabase = async () => {
    if (selectedDatabaseItems.length === 0) return

    setIsSaving(true)
    try {
      console.log("Adding items from database:", selectedDatabaseItems)
      console.log("Available work items:", allWorkItems.length)
      
      const result = await createWorkItemsFromDatabase({
        estimateId: estimate.id,
        sourceItemIds: selectedDatabaseItems
      })

      if (result.success && result.data) {
        console.log("Successfully added items:", result.data.length)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        console.error("Failed to add items:", result.error)
        alert(`Failed to add items: ${result.error}`)
      }

      setSelectedDatabaseItems([])
      setShowDatabaseSelection(false)
    } catch (error) {
      console.error("Error adding items from database:", error)
      alert("Error adding items from database")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <Calculator className="h-8 w-8 text-primary" />
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
              <Package className="h-8 w-8 text-blue-500" />
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
              <Users className="h-8 w-8 text-green-500" />
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
              <Wrench className="h-8 w-8 text-orange-500" />
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
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Selection */}
      <Card className="border-2 border-dashed border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Select from Database
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowDatabaseSelection(!showDatabaseSelection)}
            >
              {showDatabaseSelection ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showDatabaseSelection ? "Cancel" : "Browse Items"}
            </Button>
          </div>
        </CardHeader>
        
        {showDatabaseSelection && (
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select work items from existing estimates to add to this project.
              </p>
              
              {/* Debug Info */}
              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                <p>Total work items in database: {allWorkItems.length}</p>
                <p>Items from other estimates: {allWorkItems.filter(item => item.estimate.id !== estimate.id).length}</p>
                <p>Current estimate ID: {estimate.id}</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>From Estimate</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allWorkItems
                      .filter(item => item.estimate.id !== estimate.id) // Exclude current estimate
                      .length > 0 ? (
                        allWorkItems
                          .filter(item => item.estimate.id !== estimate.id)
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedDatabaseItems.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedDatabaseItems([...selectedDatabaseItems, item.id])
                                    } else {
                                      setSelectedDatabaseItems(selectedDatabaseItems.filter(id => id !== item.id))
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="max-w-[300px]">
                                <div className="font-medium">{item.description}</div>
                                {item.pageRef && (
                                  <div className="text-xs text-muted-foreground mt-1">Ref: {item.pageRef}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.estimate.title}</div>
                                  <div className="text-xs text-muted-foreground">{item.estimate.category}</div>
                                </div>
                              </TableCell>
                              <TableCell>{item.unit.unitSymbol}</TableCell>
                              <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 text-muted-foreground/50" />
                              <p>No work items found in other estimates</p>
                              <p className="text-xs">Create some work items in other estimates first</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>

              {selectedDatabaseItems.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedDatabaseItems.length} item(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDatabaseItems([])}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={handleAddFromDatabase}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {isSaving ? "Adding..." : `Add ${selectedDatabaseItems.length} Item(s)`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add New Item Form */}
      <Card className="border-2 border-dashed border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Work Item
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setIsAddingItem(!isAddingItem)}
            >
              {isAddingItem ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isAddingItem ? "Cancel" : "Add Item"}
            </Button>
          </div>
        </CardHeader>
        
        {isAddingItem && (
          <CardContent>
            <form ref={formRef} className="space-y-6">
              {/* Rate Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select from Rate Library *</Label>
                  <Popover open={isRateSelectorOpen} onOpenChange={setIsRateSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isRateSelectorOpen}
                        className="w-full justify-between"
                      >
                        {selectedRate ? (
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{selectedRate.description}</span>
                            <span className="text-sm text-muted-foreground">
                              {selectedRate.unit.unitSymbol} - ₹{selectedRate.standardRate.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          "Search and select from rate library..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search rates..."
                          value={rateSearchValue}
                          onValueChange={setRateSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>No rates found.</CommandEmpty>
                          <CommandGroup>
                            {filteredRates.map((rate) => (
                              <CommandItem
                                key={rate.id}
                                value={`${rate.description} ${rate.unit.unitSymbol}`}
                                onSelect={() => handleRateSelect(rate.id)}
                              >
                                <div className="flex flex-col w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{rate.description}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ₹{rate.standardRate.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Unit: {rate.unit.unitSymbol}</span>
                                    <span>Year: {rate.year || 'N/A'}</span>
                                  </div>
                                </div>
                                <CheckIcon
                                  className={`ml-auto h-4 w-4 ${
                                    newItem.selectedRateId === rate.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Manual Entry Option */}
                <div className="flex items-center space-x-2">
                  <Separator className="flex-1" />
                  <span className="text-sm text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewItem({ ...newItem, selectedRateId: "" })
                      setIsRateSelectorOpen(false)
                    }}
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                  >
                    Enter manually instead
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-0 text-green-600 hover:text-green-800"
                  >
                    <a href="/admin/rates" target="_blank" rel="noopener noreferrer">
                      Add new rate to library
                    </a>
                  </Button>
                </div>
              </div>

              {/* Manual Entry Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter work item description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    rows={3}
                    disabled={!!newItem.selectedRateId}
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

              {/* Unit and Rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select 
                    value={newItem.unitId} 
                    onValueChange={(value) => setNewItem({ ...newItem, unitId: value })}
                    disabled={!!newItem.selectedRateId}
                  >
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
                    disabled={!!newItem.selectedRateId}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.length || ""}
                    onChange={(e) => setNewItem({ ...newItem, length: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.width || ""}
                    onChange={(e) => setNewItem({ ...newItem, width: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.height || ""}
                    onChange={(e) => setNewItem({ ...newItem, height: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <h4 className="text-sm font-medium text-muted-foreground">Cost Breakdown</h4>
                  <Separator className="flex-1" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="materialCost">Material Cost (₹)</Label>
                    <Input
                      id="materialCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItem.materialCost || ""}
                      onChange={(e) => setNewItem({ ...newItem, materialCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="laborCost">Labor Cost (₹)</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItem.laborCost || ""}
                      onChange={(e) => setNewItem({ ...newItem, laborCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="equipmentCost">Equipment Cost (₹)</Label>
                    <Input
                      id="equipmentCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItem.equipmentCost || ""}
                      onChange={(e) => setNewItem({ ...newItem, equipmentCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="overheadCost">Overhead Cost (₹)</Label>
                    <Input
                      id="overheadCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItem.overheadCost || ""}
                      onChange={(e) => setNewItem({ ...newItem, overheadCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.discount || ""}
                    onChange={(e) => setNewItem({ ...newItem, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profitMargin">Profit Margin (%)</Label>
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Amount Preview */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calculated Amount:</span>
                  <span className="text-lg font-bold">₹{calculateAmount(newItem).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingItem(false)
                    resetForm()
                    formRef.current?.reset()
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={isSaving || !newItem.description || !newItem.unitId || newItem.rate <= 0}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Work Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Items ({workItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {workItems.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No work items yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first work item using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No.</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-20 text-right">Length</TableHead>
                    <TableHead className="w-20 text-right">Width</TableHead>
                    <TableHead className="w-20 text-right">Height</TableHead>
                    <TableHead className="w-24 text-right">Quantity</TableHead>
                    <TableHead className="w-24 text-right">Rate (₹)</TableHead>
                    <TableHead className="w-24 text-right">Material (₹)</TableHead>
                    <TableHead className="w-24 text-right">Labor (₹)</TableHead>
                    <TableHead className="w-24 text-right">Equipment (₹)</TableHead>
                    <TableHead className="w-24 text-right">Amount (₹)</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemNo}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div>
                          <div className="font-medium">{item.description}</div>
                          {item.pageRef && (
                            <div className="text-xs text-muted-foreground mt-1">Ref: {item.pageRef}</div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getUnitSymbol(item.unitId)}</TableCell>
                      <TableCell className="text-right">{(item.length || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(item.width || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(item.height || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{getCalculatedQuantity(item).toFixed(3)}</TableCell>
                      <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(item.materialCost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(item.laborCost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{(item.equipmentCost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                            disabled={isUpdating === item.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isDeleting === item.id}
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
                    <TableCell colSpan={11} className="text-right">
                      Total Estimate:
                    </TableCell>
                    <TableCell className="text-right">
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
    </div>
  )
}
