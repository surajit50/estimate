"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { getUnits } from "@/lib/actions/units"
import { getEstimate } from "@/lib/actions/estimates"

interface Unit {
  id: string
  unitName: string
  unitSymbol: string
}

interface AddMeasurementEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  measurementBookId: string
  onSuccess?: () => void
  asPage?: boolean
}

export function AddMeasurementEntryDialog({
  open,
  onOpenChange,
  measurementBookId,
  onSuccess,
  asPage,
}: AddMeasurementEntryDialogProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [workItems, setWorkItems] = useState<any[]>([])
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>("")
  const [existingEntries, setExistingEntries] = useState<any[]>([])
  const form = useForm({
    defaultValues: {
      entryDate: new Date().toISOString().split('T')[0],
      pageNo: "",
      itemNo: "",
      description: "",
      unitId: "",
      length: "",
      width: "",
      height: "",
      quantity: "",
      remarks: "",
    },
  })

  // Load units on component mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const result = await getUnits()
        if (result.success) {
          setUnits(result.data)
        }
      } catch (error) {
        console.error("Error fetching units:", error)
      }
    }

    const fetchWorkItemsForMeasurementBook = async () => {
      try {
        // Get measurement books to find the estimateId for this measurementBookId
        const mbRes = await fetch("/api/measurement-books")
        if (!mbRes.ok) return
        const mbs = await mbRes.json()
        const currentMb = (mbs || []).find((mb: any) => mb.id === measurementBookId)
        const estimateId = currentMb?.estimate?.id
        if (!estimateId) return

        // Fetch estimate with work items (includes unit and rate)
        const result = await getEstimate(estimateId)
        if (result.success) {
          setWorkItems(result.data?.workItems || [])
        }
      } catch (error) {
        console.error("Error fetching work items:", error)
      }
    }

    if (open) {
      fetchUnits()
      fetchWorkItemsForMeasurementBook()
      // fetch existing entries for duplicate detection
      const fetchExisting = async () => {
        try {
          const res = await fetch(`/api/measurement-books/${measurementBookId}/entries`)
          if (res.ok) {
            const data = await res.json()
            setExistingEntries(data || [])
          }
        } catch (e) {
          console.error("Error fetching existing entries:", e)
        }
      }
      fetchExisting()
    }
  }, [open])

  const handleWorkItemSelect = (workItemId: string) => {
    setSelectedWorkItemId(workItemId)
    const wi = workItems.find(w => w.id === workItemId)
    if (wi) {
      form.setValue("description", wi.description || form.getValues("description"))
      form.setValue("unitId", wi.unit?.id || form.getValues("unitId"))
      form.setValue("itemNo", (wi.itemNo ?? form.getValues("itemNo") ?? "").toString())
      form.setValue("pageNo", (wi.pageRef ?? form.getValues("pageNo") ?? "").toString())
      // Prefer subItem defaults if available
      const firstSub = Array.isArray(wi.subItems) ? wi.subItems.find((s: any) => Number(s.nos) > 0 || Number(s.length) > 0 || Number(s.breadth) > 0 || Number(s.depth) > 0) : undefined
      const defLen = firstSub ? Number(firstSub.length) : Number(wi.length)
      const defWid = firstSub ? Number(firstSub.breadth) : Number(wi.width)
      const defHgt = firstSub ? Number(firstSub.depth) : Number(wi.height)
      if (Number.isFinite(defLen) && defLen > 0) form.setValue("length", String(defLen))
      if (Number.isFinite(defWid) && defWid > 0) form.setValue("width", String(defWid))
      if (Number.isFinite(defHgt) && defHgt > 0) form.setValue("height", String(defHgt))

      // Prefill quantity based on unit and available nos/dimensions
      const symbol = (wi.unit?.unitSymbol || "").toLowerCase()
      const isNos = symbol === "no" || symbol.includes("nos") || symbol.includes("pcs") || symbol.includes("piece")
      if (isNos) {
        const qty = typeof wi.quantity === "number" && wi.quantity > 0 ? wi.quantity : (firstSub && Number(firstSub.nos) > 0 ? Number(firstSub.nos) : 1)
        form.setValue("quantity", qty.toString())
      } else {
        const nos = firstSub && Number(firstSub.nos) > 0 ? Number(firstSub.nos) : 1
        const l = Number.isFinite(defLen) && defLen > 0 ? defLen : 0
        const w = Number.isFinite(defWid) && defWid > 0 ? defWid : 0
        const h = Number.isFinite(defHgt) && defHgt > 0 ? defHgt : 0
        let prod = l
        if (w > 0) prod = prod * w
        if (h > 0) prod = prod * h
        const calcQty = prod > 0 ? nos * prod : (typeof wi.quantity === "number" && wi.quantity > 0 ? wi.quantity : 0)
        if (calcQty > 0) form.setValue("quantity", String(calcQty))
      }
    }
  }

  const onSubmit = async (values: any) => {
    // Derive effective quantity from dimensions for linear/area/volume units;
    // for Nos units, use entered quantity (default 1 if empty)
    const lengthVal = parseFloat(values.length) || 0
    const widthVal = parseFloat(values.width) || 0
    const heightVal = parseFloat(values.height) || 0
    const enteredQty = parseFloat(values.quantity) || 0
    const symbol = (selectedUnit?.unitSymbol || "").toLowerCase()
    const dimsRequired = getRequiredDims(symbol)
    let effectiveQuantity = enteredQty
    if (dimsRequired === 0) {
      effectiveQuantity = enteredQty > 0 ? enteredQty : 1
    } else {
      const l = lengthVal > 0 ? lengthVal : 0
      const w = dimsRequired >= 2 && widthVal > 0 ? widthVal : (dimsRequired >= 2 ? 0 : 1)
      const h = dimsRequired >= 3 && heightVal > 0 ? heightVal : (dimsRequired >= 3 ? 0 : 1)
      const product = dimsRequired === 1 ? l : dimsRequired === 2 ? l * w : l * w * h
      effectiveQuantity = product > 0 ? product : enteredQty
    }

    try {
      const response = await fetch(`/api/measurement-books/${measurementBookId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          length: parseFloat(values.length) || 0,
          width: parseFloat(values.width) || 0,
          height: parseFloat(values.height) || 0,
          quantity: effectiveQuantity,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create measurement entry")
      }

      toast.success("Measurement entry created successfully!")
      onOpenChange(false)
      if (onSuccess) onSuccess()
      
      // Reset form
      form.reset({
        entryDate: new Date().toISOString().split('T')[0],
        pageNo: "",
        itemNo: "",
        description: "",
        unitId: "",
        length: "",
        width: "",
        height: "",
        quantity: "",
        remarks: "",
      })
    } catch (error) {
      console.error("Error creating measurement entry:", error)
      toast.error("Failed to create measurement entry")
    }
  }

  // Unit-based dimension handling similar to work item dialog
  const unitId = form.watch("unitId") as string
  const selectedUnit = units.find((u) => u.id === unitId)
  const unitSymbol = (selectedUnit?.unitSymbol || "").toLowerCase()
  const getRequiredDims = (symbol?: string): 0 | 1 | 2 | 3 => {
    const s = (symbol || "").toLowerCase()
    if (!s) return 1
    if (s === "no" || s.includes("nos") || s.includes("pcs") || s.includes("piece")) return 0
    if (s.includes("³") || s.includes("m3") || s.includes("cu") || s.includes("cubic") || /\b3\b/.test(s)) return 3
    if (s.includes("²") || s.includes("m2") || s.includes("sq") || s.includes("square") || /\b2\b/.test(s)) return 2
    return 1
  }
  const requiredDims = getRequiredDims(unitSymbol)

  const FormContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {workItems.length > 0 && (
            <div className="space-y-2">
              <FormLabel>Work Item (from Estimate)</FormLabel>
              <Select value={selectedWorkItemId} onValueChange={handleWorkItemSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work item (prefills description and unit)" />
                </SelectTrigger>
                <SelectContent>
                  {workItems.map((wi) => (
                    <SelectItem key={wi.id} value={wi.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium truncate">{wi.itemNo ? `${wi.itemNo}. ` : ""}{wi.description}</span>
                        <span className="text-xs text-muted-foreground">Rate: {Number(wi.rate).toFixed(2)} {wi.unit?.unitSymbol ? `/${wi.unit.unitSymbol}` : ""}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pageNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page No. *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1/2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="itemNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item No. *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1, 2, 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Unit *</FormLabel>
              <Select value={String(form.watch("unitId") || "")} onValueChange={(v) => form.setValue("unitId", v)}>
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
              <FormMessage />
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Describe the work item" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedWorkItemId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Selected Rate</Label>
                <div className="h-10 px-3 py-2 border rounded text-sm flex items-center bg-muted/30">
                  {(() => {
                    const wi = workItems.find(w => w.id === selectedWorkItemId)
                    return wi ? `${Number(wi.rate).toFixed(2)}${wi.unit?.unitSymbol ? ` / ${wi.unit.unitSymbol}` : ""}` : "-"
                  })()}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (m)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (m)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(requiredDims >= 3) && (
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{requiredDims === 0 ? "Nos" : "Quantity"} *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder="Enter quantity" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(() => {
            // Duplicate detection by Page No + Item No within this measurement book
            const pageNo = String(form.watch("pageNo") || "").trim()
            const itemNo = String(form.watch("itemNo") || "").trim()
            const dup = pageNo && itemNo && existingEntries.some((en: any) => String(en.pageNo).trim() === pageNo && String(en.itemNo).trim() === itemNo)
            if (!dup) return null
            return (
              <div className="p-2 text-sm border border-amber-300 bg-amber-50 text-amber-800 rounded">
                An entry with the same Page No and Item No already exists. Please adjust to avoid duplicate entries.
              </div>
            )
          })()}

          {(() => {
            // Live preview for quantity and bill amount
            const lengthVal = parseFloat(String(form.watch("length") || "")) || 0
            const widthVal = parseFloat(String(form.watch("width") || "")) || 0
            const heightVal = parseFloat(String(form.watch("height") || "")) || 0
            const enteredQty = parseFloat(String(form.watch("quantity") || "")) || 0
            const dimsRequired = requiredDims
            let previewQty = enteredQty
            if (dimsRequired === 0) {
              previewQty = enteredQty > 0 ? enteredQty : 1
            } else {
              const l = lengthVal > 0 ? lengthVal : 0
              const w = dimsRequired >= 2 && widthVal > 0 ? widthVal : (dimsRequired >= 2 ? 0 : 1)
              const h = dimsRequired >= 3 && heightVal > 0 ? heightVal : (dimsRequired >= 3 ? 0 : 1)
              const product = dimsRequired === 1 ? l : dimsRequired === 2 ? l * w : l * w * h
              previewQty = product > 0 ? product : enteredQty
            }
            const wi = workItems.find(w => w.id === selectedWorkItemId)
            const rate = wi ? Number(wi.rate) || 0 : 0
            const amount = previewQty * rate
            return (
              <div className="bg-muted/30 border rounded p-3 text-sm">
                <div className="flex flex-wrap gap-4">
                  <div><span className="text-muted-foreground">Calculated Quantity:</span> <span className="font-medium">{previewQty.toFixed(3)}</span></div>
                  <div><span className="text-muted-foreground">Rate:</span> <span className="font-medium">{rate.toFixed(2)}</span></div>
                  <div><span className="text-muted-foreground">Bill Amount:</span> <span className="font-semibold">₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              </div>
            )
          })()}

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Additional notes (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={((): boolean => {
              const pageNo = String(form.watch("pageNo") || "").trim()
              const itemNo = String(form.watch("itemNo") || "").trim()
              const dup = pageNo && itemNo && existingEntries.some((en: any) => String(en.pageNo).trim() === pageNo && String(en.itemNo).trim() === itemNo)
              return Boolean(dup)
            })()}>Add Entry</Button>
          </div>
      </form>
    </Form>
  )

  if (asPage) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Add Measurement Entry</h1>
          <p className="text-muted-foreground">Add a new measurement entry to track work progress.</p>
        </div>
        {FormContent}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Measurement Entry</DialogTitle>
          <DialogDescription>
            Add a new measurement entry to track work progress.
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  )
}
