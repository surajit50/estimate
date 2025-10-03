"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

interface WorkItem {
  id: string
  itemNo: number
  description: string
  unit: {
    unitName: string
    unitSymbol: string
  }
  rate: number
  quantity: number
  amount: number
}

interface Estimate {
  id: string
  title: string
  category: string
  description: string | null
  location: string | null
  createdAt: Date
  cgst: number
  sgst: number
  lwCess: number
  contingency: number
  workItems: WorkItem[]
}

interface AbstractViewProps {
  estimate: Estimate
}

export function AbstractView({ estimate }: AbstractViewProps) {
  const subTotal = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)

  const cgst = (subTotal * estimate.cgst) / 100
  const sgst = (subTotal * estimate.sgst) / 100
  const lwCess = (subTotal * estimate.lwCess) / 100
  const contingency = (subTotal * estimate.contingency) / 100

  const totalAmount = subTotal + cgst + sgst + lwCess + contingency

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="text-center space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Abstract of Estimate</h1>
            <p className="text-muted-foreground mt-2">Detailed Cost Breakdown</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-sm text-muted-foreground">Project Title</p>
              <p className="font-semibold">{estimate.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="secondary">{estimate.category}</Badge>
            </div>
            {estimate.location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{estimate.location}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{format(new Date(estimate.createdAt), "dd MMMM yyyy")}</p>
            </div>
          </div>
          {estimate.description && (
            <>
              <Separator />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{estimate.description}</p>
              </div>
            </>
          )}
        </CardHeader>
      </Card>

      {/* Work Items Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">S.No.</TableHead>
                <TableHead>Description of Work</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate (₹)</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimate.workItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemNo}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.unit.unitSymbol}</TableCell>
                  <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="bg-muted/30">
                <TableCell colSpan={5} className="text-right font-semibold">
                  Sub Total:
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ₹{subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>

              {estimate.cgst > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-right">
                    Add CGST @ {estimate.cgst}%:
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              )}

              {estimate.sgst > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-right">
                    Add SGST @ {estimate.sgst}%:
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              )}

              {estimate.lwCess > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-right">
                    Add L.W. Cess @ {estimate.lwCess}%:
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{lwCess.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              )}

              {estimate.contingency > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-right">
                    Add Contingency @ {estimate.contingency}%:
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{contingency.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              )}

              <TableRow className="bg-primary/10 border-t-2 border-primary">
                <TableCell colSpan={5} className="text-right font-bold text-lg">
                  Grand Total:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total Number of Items:</span>
              <span>{estimate.workItems.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl">
              <span className="font-bold">Estimated Project Cost:</span>
              <span className="font-bold text-primary">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Amount in words: {numberToWords(totalAmount)} Rupees Only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to convert number to words (simplified version)
function numberToWords(num: number): string {
  if (num === 0) return "Zero"

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]

  function convertLessThanThousand(n: number): string {
    if (n === 0) return ""
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
  }

  let integerPart = Math.floor(num)
  let result = ""

  if (integerPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(integerPart / 10000000)) + " Crore "
    integerPart %= 10000000
  }
  if (integerPart >= 100000) {
    result += convertLessThanThousand(Math.floor(integerPart / 100000)) + " Lakh "
    integerPart %= 100000
  }
  if (integerPart >= 1000) {
    result += convertLessThanThousand(Math.floor(integerPart / 1000)) + " Thousand "
    integerPart %= 1000
  }
  if (integerPart > 0) {
    result += convertLessThanThousand(integerPart)
  }

  return result.trim()
}
