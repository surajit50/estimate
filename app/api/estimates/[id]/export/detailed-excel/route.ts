import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'

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

    // Prepare detailed data for Excel
    const detailedData: any[] = []
    
    estimate.workItems.forEach((item) => {
      // Main item
      detailedData.push({
        'Item No': item.itemNo || '',
        'Description': item.description || '',
        'Unit': item.unit?.unitSymbol || '',
        'Quantity': item.quantity || 0,
        'Rate (₹)': item.rate || 0,
        'Amount (₹)': item.amount || 0,
        'Type': 'Main Item',
        'Sub Category': '',
        'Sub Item': '',
      })

      // Sub-categories and their items
      if (item.subCategories && item.subCategories.length > 0) {
        item.subCategories.forEach((subCat) => {
          detailedData.push({
            'Item No': '',
            'Description': subCat.categoryName,
            'Unit': '',
            'Quantity': '',
            'Rate (₹)': '',
            'Amount (₹)': '',
            'Type': 'Sub Category',
            'Sub Category': subCat.categoryName,
            'Sub Item': '',
          })

          if (subCat.subItems && subCat.subItems.length > 0) {
            subCat.subItems.forEach((subItem) => {
              detailedData.push({
                'Item No': '',
                'Description': subItem.description,
                'Unit': '',
                'Quantity': subItem.quantity || 0,
                'Rate (₹)': subItem.rate || 0,
                'Amount (₹)': subItem.amount || 0,
                'Type': 'Sub Item',
                'Sub Category': subCat.categoryName,
                'Sub Item': subItem.description,
              })
            })
          }
        })
      }

      // Direct sub-items
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem) => {
          detailedData.push({
            'Item No': '',
            'Description': subItem.description,
            'Unit': '',
            'Quantity': subItem.quantity || 0,
            'Rate (₹)': subItem.rate || 0,
            'Amount (₹)': subItem.amount || 0,
            'Type': 'Direct Sub Item',
            'Sub Category': '',
            'Sub Item': subItem.description,
          })
        })
      }
    })

    // Calculate totals
    const totalAmount = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Add estimate details sheet
    const estimateDetails = [
      ['Detailed Estimate', ''],
      ['Title', estimate.title],
      ['Category', estimate.category],
      ['Location', estimate.location || ''],
      ['Description', estimate.description || ''],
      ['Date', new Date(estimate.createdAt).toLocaleDateString()],
      ['Total Amount', totalAmount],
      ['', ''],
      ['Work Items Breakdown', ''],
    ]

    const detailsSheet = XLSX.utils.aoa_to_sheet(estimateDetails)
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Estimate Details')

    // Add detailed work items sheet
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Work Items')

    // Add summary sheet
    const summaryData = estimate.workItems.map(item => ({
      'Item No': item.itemNo || '',
      'Description': item.description || '',
      'Unit': item.unit?.unitSymbol || '',
      'Quantity': item.quantity || 0,
      'Rate (₹)': item.rate || 0,
      'Amount (₹)': item.amount || 0,
    }))

    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename
    const filename = sanitizeFilename(`detailed-estimate-${estimate.title}-${new Date().toISOString().split('T')[0]}.xlsx`)

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating detailed Excel:', error)
    return NextResponse.json({ error: 'Failed to generate detailed Excel' }, { status: 500 })
  }
}
