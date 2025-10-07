"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Unit { id: string; unitName: string; unitSymbol: string }

interface BillItem {
  id?: string
  measurementEntryId?: string
  description: string
  unitId: string
  quantity: number
  rate: number
  amount: number
}

export default function EditAbstractBillPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [formData, setFormData] = useState({
    billNo: "",
    billDate: "",
    periodFrom: "",
    periodTo: "",
    contractor: "",
    engineer: "",
    status: "draft",
  })
  const [items, setItems] = useState<BillItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [billRes, unitRes] = await Promise.all([
          fetch(`/api/abstract-bills/${id}`),
          fetch("/api/units"),
        ])
        if (unitRes.ok) setUnits(await unitRes.json())
        if (!billRes.ok) throw new Error("Failed to load abstract bill")
        const bill = await billRes.json()
        setFormData({
          billNo: bill.billNo || "",
          billDate: bill.billDate ? new Date(bill.billDate).toISOString().slice(0, 10) : "",
          periodFrom: bill.periodFrom ? new Date(bill.periodFrom).toISOString().slice(0, 10) : "",
          periodTo: bill.periodTo ? new Date(bill.periodTo).toISOString().slice(0, 10) : "",
          contractor: bill.contractor || "",
          engineer: bill.engineer || "",
          status: bill.status || "draft",
        })
        setItems(
          (bill.items || []).map((it: any) => ({
            id: it.id,
            measurementEntryId: it.measurementEntryId || undefined,
            description: it.description,
            unitId: it.unitId,
            quantity: it.quantity,
            rate: it.rate,
            amount: it.amount,
          }))
        )
      } catch (e) {
        toast.error("Could not load abstract bill")
      }
    }
    load()
  }, [id])

  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev]
      // @ts-ignore
      updated[index] = { ...updated[index], [field]: value }
      if (field === "quantity" || field === "rate") {
        updated[index].amount = (Number(updated[index].quantity) || 0) * (Number(updated[index].rate) || 0)
      }
      return updated
    })
  }

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/abstract-bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map(it => ({
            measurementEntryId: it.measurementEntryId,
            description: it.description,
            unitId: it.unitId,
            quantity: Number(it.quantity) || 0,
            rate: Number(it.rate) || 0,
          })),
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Abstract bill updated")
      router.push(`/abstract-bills/${id}`)
      router.refresh()
    } catch (e) {
      toast.error("Failed to update abstract bill")
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <main className="container mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/abstract-bills/${id}`}>
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-semibold">Edit Abstract Bill</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Bill Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billNo">Bill Number *</Label>
                  <Input id="billNo" value={formData.billNo} onChange={(e) => setFormData({ ...formData, billNo: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billDate">Bill Date *</Label>
                  <Input id="billDate" type="date" value={formData.billDate} onChange={(e) => setFormData({ ...formData, billDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodFrom">Period From *</Label>
                  <Input id="periodFrom" type="date" value={formData.periodFrom} onChange={(e) => setFormData({ ...formData, periodFrom: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodTo">Period To *</Label>
                  <Input id="periodTo" type="date" value={formData.periodTo} onChange={(e) => setFormData({ ...formData, periodTo: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractor">Contractor</Label>
                  <Input id="contractor" value={formData.contractor} onChange={(e) => setFormData({ ...formData, contractor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engineer">Engineer</Label>
                  <Input id="engineer" value={formData.engineer} onChange={(e) => setFormData({ ...formData, engineer: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill Items</CardTitle>
            </CardHeader>
            <CardContent>
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
                          <Input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Select value={item.unitId} onValueChange={(val) => updateItem(index, 'unitId', val)}>
                            <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                            <SelectContent>
                              {units.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.unitName} ({u.unitSymbol})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" value={item.rate} onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell className="font-medium">{(Number(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-4">
                <div className="text-lg font-semibold">Total Amount: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (<><Save className="h-4 w-4 mr-2" /> Save Changes</>)}
            </Button>
            <Link href={`/abstract-bills/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
        </form>
      </main>
    </div>
  )
}


