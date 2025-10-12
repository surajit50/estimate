import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatCurrency, sanitizeFilename } from '@/lib/export-utils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
            subCategories: {
              include: {
                subItems: true,
              },
            },
          },
          orderBy: { itemNo: 'asc' },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('DETAILED ESTIMATE', 105, 20, { align: 'center' })
    
    // Add estimate details
    doc.setFontSize(12)
    doc.text(`Title: ${estimate.title}`, 20, 35)
    doc.text(`Category: ${estimate.category}`, 20, 45)
    if (estimate.location) {
      doc.text(`Location: ${estimate.location}`, 20, 55)
    }
    if (estimate.description) {
      doc.text(`Description: ${estimate.description}`, 20, 15)
    }
    doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 20, 65)
    
    // Calculate totals
    const totalAmount = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 75)

    // Add work items table with sub-items
    let currentY = 85
    
    estimate.workItems.forEach((item, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }

      // Main item
      doc.setFontSize(10)
      doc.text(`${item.itemNo}. ${item.description}`, 20, currentY)
      currentY += 10
      
      doc.text(`Unit: ${item.unit?.unitSymbol || ''} | Qty: ${item.quantity?.toFixed(3) || '0.000'} | Rate: ${formatCurrency(item.rate || 0)} | Amount: ${formatCurrency(item.amount || 0)}`, 25, currentY)
      currentY += 15

      // Sub-categories
      if (item.subCategories && item.subCategories.length > 0) {
        item.subCategories.forEach((subCat) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }
          
          doc.setFontSize(9)
          doc.text(`  ${subCat.categoryName}`, 30, currentY)
          currentY += 10

          // Sub-items
          if (subCat.subItems && subCat.subItems.length > 0) {
            subCat.subItems.forEach((subItem) => {
              if (currentY > 250) {
                doc.addPage()
                currentY = 20
              }
              
              doc.setFontSize(8)
              doc.text(`    - ${subItem.description}`, 35, currentY)
              currentY += 8
              doc.text(`      Qty: ${subItem.quantity?.toFixed(3) || '0.000'} | Rate: ${formatCurrency(subItem.rate || 0)} | Amount: ${formatCurrency(subItem.amount || 0)}`, 40, currentY)
              currentY += 10
            })
          }
        })
      }

      // Direct sub-items
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }
          
          doc.setFontSize(8)
          doc.text(`  - ${subItem.description}`, 30, currentY)
          currentY += 8
          doc.text(`    Qty: ${subItem.quantity?.toFixed(3) || '0.000'} | Rate: ${formatCurrency(subItem.rate || 0)} | Amount: ${formatCurrency(subItem.amount || 0)}`, 35, currentY)
          currentY += 10
        })
      }

      currentY += 5
    })

    // Generate filename
    const filename = sanitizeFilename(`detailed-estimate-${estimate.title}-${new Date().toISOString().split('T')[0]}.pdf`)

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating detailed PDF:', error)
    return NextResponse.json({ error: 'Failed to generate detailed PDF' }, { status: 500 })
  }
}
