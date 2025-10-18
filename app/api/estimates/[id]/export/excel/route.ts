import { prisma } from "@/lib/db"
import { sanitizeFilename } from "@/lib/export-utils"
import XLSX from "xlsx"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: { workItems: { include: { unit: true }, orderBy: { itemNo: "asc" } } },
  })
  if (!estimate) return new Response(JSON.stringify({ error: "Estimate not found" }), { status: 404 })

  const rows = estimate.workItems.map((wi, idx) => ({
    No: wi.itemNo ?? idx + 1,
    Description: wi.description,
    Unit: wi.unit?.unitSymbol || "",
    Qty: Number(wi.quantity || 0),
    Rate: Number(wi.rate || 0),
    Amount: Number(wi.amount || 0),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, "Abstract")

  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer
  const buffer = Buffer.from(wbout)
  const filename = `${sanitizeFilename(estimate.title)}-abstract.xlsx`
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
