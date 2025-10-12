"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getUnits } from "@/lib/actions/units"
import { getEstimate } from "@/lib/actions/estimates"

interface MeasurementBook {
  id: string
  title: string
  entries: MeasurementEntry[]
  contractor?: string | null
  engineer?: string | null
  estimate: {
    id: string
    title: string
    category: string
  }
}

interface MeasurementEntry {
  id: string
  entryDate: string
  pageNo: string
  itemNo: string
  description: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  quantity: number
}

interface AbstractBillItem {
  measurementEntryId?: string
  description: string
  unitId: string
  quantity: number
  rate: number
  amount: number
}

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

export default function NewAbstractBillPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [measurementBooks, setMeasurementBooks] = useState<MeasurementBook[]>([])
  const [selectedMeasurementBook, setSelectedMeasurementBook] = useState<MeasurementBook | null>(null)
  const [formData, setFormData] = useState({
    measurementBookId: "",
    billNo: "",
    billDate: "",
    periodFrom: "",
    periodTo: "",
    contractor: "",
    engineer: "",
  })
  const [items, setItems] = useState<AbstractBillItem[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [estimateWorkItems, setEstimateWorkItems] = useState<any[]>([])

  // Load measurement books on component mount
  useEffect(() => {
    const fetchMeasurementBooks = async () => {
      try {
        const response = await fetch("/api/measurement-books")
        if (response.ok) {
          const measurementBooksData = await response.json()
          setMeasurementBooks(measurementBooksData)
        }
      } catch (error) {
        console.error("Error fetching measurement books:", error)
      }
    }

    fetchMeasurementBooks()
    // Load units for unit selection
    const fetchUnits = async () => {
      try {
        const result = await getUnits()
        if (result.success) {
          setUnits(result.data)
        }
      } catch (e) {
        console.error("Error fetching units", e)
      }
    }
    fetchUnits()
  }, [])

  const handleMeasurementBookChange = (measurementBookId: string) => {
    setFormData(prev => ({ ...prev, measurementBookId }))
    const measurementBook = measurementBooks.find(mb => mb.id === measurementBookId)
    setSelectedMeasurementBook(measurementBook || null)
    
    if (measurementBook) {
      // Pre-populate contractor and engineer from measurement book
      setFormData(prev => ({
        ...prev,
        contractor: measurementBook.contractor || "",
        engineer: measurementBook.engineer || "",
      }))

      // Load estimate work items to prefill rates for added entries
      const loadEstimateWorkItems = async () => {
        try {
          const estimateId = measurementBook.estimate.id
          if (!estimateId) return
          const result = await getEstimate(estimateId)
          if (result.success) {
            setEstimateWorkItems(result.data?.workItems || [])
          } else {
            setEstimateWorkItems([])
          }
        } catch (e) {
          console.error("Error fetching estimate work items", e)
          setEstimateWorkItems([])
        }
      }
      loadEstimateWorkItems()
    }
  }

  const addItemFromEntry = (entry: MeasurementEntry) => {
    // Try to find a matching work item by description and unit to prefill rate
    const match = estimateWorkItems.find((wi) => {
      const sameUnit = wi?.unit?.id === entry.unit.id
      const sameDesc = (wi?.description || "").trim().toLowerCase() === (entry.description || "").trim().toLowerCase()
      return sameUnit && sameDesc
    })

    const prefillRate = match ? Number(match.rate) || 0 : 0
    const newItem: AbstractBillItem = {
      measurementEntryId: entry.id,
      description: entry.description,
      unitId: entry.unit.id,
      quantity: entry.quantity,
      rate: prefillRate,
      amount: (entry.quantity || 0) * prefillRate,
    }
    setItems(prev => [...prev, newItem])
  }

  const addCustomItem = () => {
    const newItem: AbstractBillItem = {
      description: "",
      unitId: "",
      quantity: 0,
      rate: 0,
      amount: 0,
    }
    setItems(prev => [...prev, newItem])
  }

  const updateItem = (index: number, field: keyof AbstractBillItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      
      // Recalculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        updated[index].amount = updated[index].quantity * updated[index].rate
      }
      
      return updated
    })
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/abstract-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.description && item.unitId && item.quantity > 0 && item.rate > 0),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create abstract bill")
      }

      const abstractBill = await response.json()
      toast.success("Abstract bill created successfully!")
      router.push(`/abstract-bills/${abstractBill.id}`)
    } catch (error) {
      console.error("Error creating abstract bill:", error)
      toast.error("Failed to create abstract bill")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/abstract-bills">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Create Abstract Bill</h1>
              <p className="text-muted-foreground">
                Create a new abstract bill based on measurement book entries
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Bill Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="measurementBookId">Measurement Book *</Label>
                    <Select
                      value={formData.measurementBookId}
                      onValueChange={handleMeasurementBookChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select measurement book" />
                      </SelectTrigger>
                      <SelectContent>
                        {measurementBooks.map((measurementBook) => (
                          <SelectItem key={measurementBook.id} value={measurementBook.id}>
                            <div>
                              <div className="font-medium">{measurementBook.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {measurementBook.estimate.title} - {measurementBook.entries.length} entries
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billNo">Bill Number *</Label>
                    <Input
                      id="billNo"
                      value={formData.billNo}
                      onChange={(e) => handleInputChange("billNo", e.target.value)}
                      placeholder="Enter bill number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billDate">Bill Date *</Label>
                    <Input
                      id="billDate"
                      type="date"
                      value={formData.billDate}
                      onChange={(e) => handleInputChange("billDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodFrom">Period From *</Label>
                    <Input
                      id="periodFrom"
                      type="date"
                      value={formData.periodFrom}
                      onChange={(e) => handleInputChange("periodFrom", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodTo">Period To *</Label>
                    <Input
                      id="periodTo"
                      type="date"
                      value={formData.periodTo}
                      onChange={(e) => handleInputChange("periodTo", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractor">Contractor</Label>
                    <Input
                      id="contractor"
                      value={formData.contractor}
                      onChange={(e) => handleInputChange("contractor", e.target.value)}
                      placeholder="Contractor name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="engineer">Engineer</Label>
                    <Input
                      id="engineer"
                      value={formData.engineer}
                      onChange={(e) => handleInputChange("engineer", e.target.value)}
                      placeholder="Engineer name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedMeasurementBook && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Measurement Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead>Item No.</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMeasurementBook.entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.pageNo}</TableCell>
                            <TableCell>{entry.itemNo}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {entry.description}
                            </TableCell>
                            <TableCell>{entry.quantity}</TableCell>
                            <TableCell>
                              <span className="text-sm bg-muted px-2 py-1 rounded">
                                {entry.unit.unitSymbol}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addItemFromEntry(entry)}
                              >
                                Add to Bill
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Bill Items
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCustomItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Item
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Select entries from the measurement book or add custom items.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Item description"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.unitId}
                                onValueChange={(val) => updateItem(index, 'unitId', val)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {units.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.unitName} ({u.unitSymbol})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="flex justify-end pt-4">
                    <div className="text-lg font-semibold">
                      Total Amount: {formatCurrency(totalAmount)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || items.length === 0}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Abstract Bill
                  </>
                )}
              </Button>
              <Link href="/abstract-bills">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
