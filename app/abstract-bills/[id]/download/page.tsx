import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function AbstractBillDownloadPage({ params }: { params: { id: string } }) {
  const { id } = params

  const abstractBill = await prisma.abstractBill.findUnique({
    where: { id },
    include: {
      measurementBook: {
        include: {
          estimate: {
            select: { id: true, title: true, category: true, cgstPercent: true, sgstPercent: true, cessPercent: true, contingency: true },
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

  if (!abstractBill) notFound()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount)

  const total = abstractBill.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
  const cgstPercent = Number(abstractBill.measurementBook.estimate?.cgstPercent ?? 0)
  const sgstPercent = Number(abstractBill.measurementBook.estimate?.sgstPercent ?? 0)
  const cessPercent = Number(abstractBill.measurementBook.estimate?.cessPercent ?? 0)
  const cgst = (total * cgstPercent) / 100
  const sgst = (total * sgstPercent) / 100
  const cess = (total * cessPercent) / 100
  const gross = total + cgst + sgst + cess

  return (
    <div className="p-8 print:p-0">
      <div className="max-w-5xl mx-auto bg-white text-black">
        <div className="text-center border-b pb-3">
          <div className="text-sm">BILL ABSTRACT FORM</div>
          <div className="font-semibold">1st & Final Bill</div>
        </div>
        <div className="flex items-start justify-between border-b py-3 text-sm">
          <div>
            <div className="font-semibold">Name of Work:</div>
            <div className="max-w-[700px]">
              {abstractBill.measurementBook.estimate.title}
            </div>
            <div className="mt-2"><span className="text-muted-foreground">Bill No:</span> {abstractBill.billNo}</div>
          </div>
          <div className="text-right">
            <div><span className="text-muted-foreground">Bill Date:</span> {new Date(abstractBill.billDate).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground">Period:</span> {new Date(abstractBill.periodFrom).toLocaleDateString()} - {new Date(abstractBill.periodTo).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground">Measurement Book:</span> {abstractBill.measurementBook.title}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm py-3">
          <div><span className="text-muted-foreground">Estimate:</span> {abstractBill.measurementBook.estimate.title}</div>
          <div className="text-right"><span className="text-muted-foreground">Engineer:</span> {abstractBill.engineer || "-"}</div>
          <div><span className="text-muted-foreground">Contractor:</span> {abstractBill.contractor || "-"}</div>
          <div className="text-right"><span className="text-muted-foreground">Category:</span> {abstractBill.measurementBook.estimate.category}</div>
        </div>

        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-gray-50 text-xs">
              <th className="text-left p-2 border-b w-10">Sl. No.</th>
              <th className="text-left p-2 border-b">Items</th>
              <th className="text-left p-2 border-b w-40">MB No. & Page No.</th>
              <th className="text-right p-2 border-b w-28">Quantity executed</th>
              <th className="text-left p-2 border-b w-16">Unit</th>
              <th className="text-right p-2 border-b w-24">Rate</th>
              <th className="text-right p-2 border-b w-28">Amount</th>
              <th className="text-left p-2 border-b w-24">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {abstractBill.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="p-2 border-b align-top">{idx + 1}</td>
                <td className="p-2 border-b align-top">{item.description}</td>
                <td className="p-2 border-b align-top">{abstractBill.measurementBook.title}{item.measurementEntry?.pageNo ? `, P- ${item.measurementEntry.pageNo}` : ""}</td>
                <td className="p-2 border-b text-right align-top">{Number(item.quantity).toFixed(3)}</td>
                <td className="p-2 border-b align-top">{item.unit?.unitSymbol || "-"}</td>
                <td className="p-2 border-b text-right align-top">{Number(item.rate).toFixed(2)}</td>
                <td className="p-2 border-b text-right align-top">{formatCurrency(Number(item.amount) || 0)}</td>
                <td className="p-2 border-b align-top"></td>
              </tr>
            ))}
            <tr>
              <td className="p-2 text-right font-semibold" colSpan={6}>Itemwise Total</td>
              <td className="p-2 text-right font-semibold">{formatCurrency(total)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
          <div></div>
          <div className="border rounded p-3">
            <div className="flex justify-between py-1"><span>Actual Value of Work done</span><span>{formatCurrency(total)}</span></div>
            <div className="flex justify-between py-1"><span>Add CGST @ {cgstPercent.toFixed(2)}%</span><span>{formatCurrency(cgst)}</span></div>
            <div className="flex justify-between py-1"><span>Add SGST @ {sgstPercent.toFixed(2)}%</span><span>{formatCurrency(sgst)}</span></div>
            <div className="flex justify-between py-1"><span>Add L.W. Cess @ {cessPercent.toFixed(2)}%</span><span>{formatCurrency(cess)}</span></div>
            <div className="flex justify-between py-2 border-t mt-2 font-semibold"><span>GROSS BILL AMOUNT</span><span>{formatCurrency(gross)}</span></div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="h-10"></div>
            <div className="border-t">Sig.of Contractor</div>
          </div>
          <div className="text-center">
            <div className="h-10"></div>
            <div className="border-t">Sig.of Nirman Sahayak</div>
          </div>
          <div className="text-center">
            <div className="h-10"></div>
            <div className="border-t">Sig.of E.A./Secretary</div>
          </div>
          <div className="text-center">
            <div className="h-10"></div>
            <div className="border-t">Sig.of Pradhan</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Tip: Use your browser's Print dialog (Ctrl/Cmd + P) to save this page as PDF.
        </div>
      </div>
    </div>
  )
}


