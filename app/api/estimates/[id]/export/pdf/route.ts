import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sanitizeFilename } from "@/lib/export-utils"
import jsPDF from "jspdf"
import "jspdf-autotable"

function norm(sym?: string) {
  return (sym || "").trim().toLowerCase()
}
function isArea(sym?: string) {
  const s = norm(sym)
  return s === "m2" || s === "m²" || s === "sqm" || s.includes("square") || s === "sq m" || s === "sq. m"
}
function isVol(sym?: string) {
  const s = norm(sym)
  return s === "m3" || s === "m³" || s === "cum" || s.includes("cubic") || s === "cu m" || s === "cu. m"
}
function isLin(sym?: string) {
  const s = norm(sym)
  return s === "m" || s === "rm" || s.includes("running") || s === "meter" || s === "metre" || s === "mtr"
}
function deriveQty(item: any, symbol?: string) {
  const l = Number(item.length) || 0
  const w = Number(item.width) || 0
  const h = Number(item.height) || 0
  const q = Number(item.quantity) || 0
  const s = norm(symbol)
  if (isArea(s)) {
    const v = l * w
    return v > 0 ? v : q
  }
  if (isVol(s)) {
    const v = l * w * h
    return v > 0 ? v : q
  }
  if (isLin(s)) {
    return l > 0 ? l : q
  }
  return q
}

export async function GET(_req: Request, ctx: any) {
  const id = ctx?.params?.id as string
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: { workItems: { include: { unit: true }, orderBy: { itemNo: "asc" } } },
  })
  if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 })

  const doc: any = new jsPDF({ unit: "pt", format: "a4" })
  doc.setFontSize(14)
  doc.text(`Abstract of Estimate`, 40, 40)
  doc.setFontSize(11)
  doc.text(estimate.title, 40, 58)
  doc.setFontSize(9)
  doc.text(`Category: ${estimate.category}`, 40, 72)
  if (estimate.location) doc.text(`Location: ${estimate.location}`, 40, 84)

  let total = 0
  const body = estimate.workItems.map((wi, idx) => {
    const sym = wi.unit?.unitSymbol || ""
    const qty = deriveQty(wi, sym)
    const amt = qty * (Number(wi.rate) || 0)
    total += amt
    return [String(wi.itemNo ?? idx + 1), wi.description, sym, qty.toFixed(3), (Number(wi.rate) || 0).toFixed(2), amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })]
  })

  doc.autoTable({
    head: [["No.", "Description", "Unit", "Qty", "Rate", "Amount"]],
    body,
    startY: 100,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240] },
    columnStyles: { 0: { cellWidth: 36 }, 2: { cellWidth: 48, halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    foot: [["", "", "", "", "Total", total.toLocaleString("en-IN", { minimumFractionDigits: 2 })]],
    footStyles: { fontStyle: "bold" },
  })

  const buffer = Buffer.from(doc.output("arraybuffer") as ArrayBuffer)
  const filename = `${sanitizeFilename(estimate.title)}-abstract.pdf`
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
