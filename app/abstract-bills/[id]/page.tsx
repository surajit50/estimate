import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function AbstractBillDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params Promise
  const { id } = await params

  const abstractBill = await prisma.abstractBill.findUnique({
    where: { id },
    include: {
      measurementBook: {
        include: {
          estimate: {
            select: { id: true, title: true, category: true },
          },
        },
      },
      items: {
        include: {
          unit: true,
          measurementEntry: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!abstractBill) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/abstract-bills">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Bill #{abstractBill.billNo}</h1>
              <p className="text-muted-foreground">
                {abstractBill.measurementBook.title} • {abstractBill.measurementBook.estimate.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(abstractBill.status)}>{abstractBill.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/api/abstract-bills/${id}/export/pdf`}
                      target="_blank"
                      className="cursor-pointer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/api/abstract-bills/${id}/export/excel`}
                      target="_blank"
                      className="cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bill Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Bill Date</div>
                <div className="font-medium">{new Date(abstractBill.billDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Period</div>
                <div className="font-medium">
                  {new Date(abstractBill.periodFrom).toLocaleDateString()} - {new Date(abstractBill.periodTo).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="font-semibold">{formatCurrency(abstractBill.totalAmount)}</div>
              </div>
              {(abstractBill.contractor || abstractBill.engineer) && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Contractor</div>
                    <div className="font-medium">{abstractBill.contractor || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Engineer</div>
                    <div className="font-medium">{abstractBill.engineer || "-"}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abstractBill.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-md truncate">{item.description}</TableCell>
                        <TableCell>{item.unit?.unitSymbol || "-"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-4">
                <div className="text-lg font-semibold">Total: {formatCurrency(abstractBill.totalAmount)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}