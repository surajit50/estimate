"use client"

import type { EstimateWithItems } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DetailedViewProps {
  estimate: EstimateWithItems
}

export function DetailedView({ estimate }: DetailedViewProps) {
  const subtotal = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)
  const cgstAmount = (subtotal * (estimate.cgstPercent ?? 0)) / 100
  const sgstAmount = (subtotal * (estimate.sgstPercent ?? 0)) / 100
  const lwCessAmount = (subtotal * (estimate.cessPercent ?? 0)) / 100
  const contingencyAmount = (subtotal * (estimate.contingency ?? 0)) / 100
  const grandTotal = subtotal + cgstAmount + sgstAmount + lwCessAmount + contingencyAmount

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{estimate.title}</CardTitle>
          {estimate.activityCode && (
            <p className="text-sm text-muted-foreground">Activity Code: {estimate.activityCode}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Category:</span> {estimate.category}
            </div>
            {estimate.location && (
              <div>
                <span className="font-medium">Location:</span> {estimate.location}
              </div>
            )}
          </div>
          {estimate.description && (
            <div className="text-sm">
              <span className="font-medium">Description:</span> {estimate.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead className="w-24">Page/Item</TableHead>
                <TableHead>Description of Item</TableHead>
                <TableHead className="w-16 text-center">Nos</TableHead>
                <TableHead className="w-20 text-center">Length (m)</TableHead>
                <TableHead className="w-20 text-center">Breadth (m)</TableHead>
                <TableHead className="w-20 text-center">Depth (m)</TableHead>
                <TableHead className="w-24 text-right">Quantity</TableHead>
                <TableHead className="w-16">Unit</TableHead>
                <TableHead className="w-24 text-right">Rate (₹)</TableHead>
                <TableHead className="w-32 text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimate.workItems.map((item) => (
                <>
                  {/* Main Item Row */}
                  <TableRow key={item.id} className="font-medium">
                    <TableCell>{item.itemNo}</TableCell>
                    <TableCell>{item.pageRef ?? "-"}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right">{item.quantity.toFixed(3)}</TableCell>
                    <TableCell>{item.unit.unitSymbol}</TableCell>
                    <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">{item.amount.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* Sub-Items Rows */}
                  {item.subItems &&
                    item.subItems.length > 0 &&
                    item.subItems.map((subItem, idx) => (
                      <TableRow key={`${item.id}-sub-${idx}`} className="bg-muted/30 text-sm">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="pl-8 italic">{subItem.description}</TableCell>
                        <TableCell className="text-center">{subItem.nos}</TableCell>
                        <TableCell className="text-center">{subItem.length?.toFixed(3) || "-"}</TableCell>
                        <TableCell className="text-center">{subItem.breadth?.toFixed(3) || "-"}</TableCell>
                        <TableCell className="text-center">{subItem.depth?.toFixed(3) || "-"}</TableCell>
                        <TableCell className="text-right">{subItem.quantity.toFixed(3)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                </>
              ))}

              {/* Totals Section */}
              <TableRow className="border-t-2 font-semibold">
                <TableCell colSpan={10} className="text-right">
                  Subtotal:
                </TableCell>
                <TableCell className="text-right">₹ {subtotal.toFixed(2)}</TableCell>
              </TableRow>

              {(estimate.cgstPercent ?? 0) > 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-right">
                    CGST @ {estimate.cgstPercent}%:
                  </TableCell>
                  <TableCell className="text-right">₹ {cgstAmount.toFixed(2)}</TableCell>
                </TableRow>
              )}

              {(estimate.sgstPercent ?? 0) > 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-right">
                    SGST @ {estimate.sgstPercent}%:
                  </TableCell>
                  <TableCell className="text-right">₹ {sgstAmount.toFixed(2)}</TableCell>
                </TableRow>
              )}

              {(estimate.cessPercent ?? 0) > 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-right">
                    L.W. Cess @ {estimate.cessPercent}%:
                  </TableCell>
                  <TableCell className="text-right">₹ {lwCessAmount.toFixed(2)}</TableCell>
                </TableRow>
              )}

              {(estimate.contingency ?? 0) > 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-right">
                    Contingency @ {estimate.contingency}%:
                  </TableCell>
                  <TableCell className="text-right">₹ {contingencyAmount.toFixed(2)}</TableCell>
                </TableRow>
              )}

              <TableRow className="border-t-2 font-bold text-lg">
                <TableCell colSpan={10} className="text-right">
                  Grand Total:
                </TableCell>
                <TableCell className="text-right">₹ {grandTotal.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
