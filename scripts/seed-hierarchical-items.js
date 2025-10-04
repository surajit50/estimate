const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding hierarchical work items...')

  // Create units first
  const units = await Promise.all([
    prisma.unitMaster.upsert({
      where: { unitName: 'Cubic Meter' },
      update: {},
      create: {
        unitName: 'Cubic Meter',
        unitSymbol: 'M³',
      },
    }),
    prisma.unitMaster.upsert({
      where: { unitName: 'Each' },
      update: {},
      create: {
        unitName: 'Each',
        unitSymbol: 'each',
      },
    }),
    prisma.unitMaster.upsert({
      where: { unitName: 'Thousand Numbers' },
      update: {},
      create: {
        unitName: 'Thousand Numbers',
        unitSymbol: '1000 nos.',
      },
    }),
    prisma.unitMaster.upsert({
      where: { unitName: 'Tonne' },
      update: {},
      create: {
        unitName: 'Tonne',
        unitSymbol: 'tonne',
      },
    }),
  ])

  console.log('✅ Units created')

  // Create a sample estimate
  const estimate = await prisma.estimate.create({
    data: {
      title: 'Road Construction Project - Sample',
      category: 'Road',
      description: 'Sample road construction project with hierarchical work items',
      location: 'West Bengal',
      activityCode: 'ROAD-001',
      cgstPercent: 9.0,
      sgstPercent: 9.0,
      cessPercent: 1.0,
      contingency: 5.0,
    },
  })

  console.log('✅ Estimate created')

  // Create hierarchical work items based on the sample pattern

  // 1. Loading materials into Railway Wagon (Item 1.01)
  const loadingItem = await prisma.workItem.create({
    data: {
      estimateId: estimate.id,
      itemNo: 1,
      pageRef: '1/1.01',
      description: 'Loading materials into Railway Wagon including necessary carriage by head load within a lead of 50 m',
      unitId: units[0].id, // Cubic Meter
      rate: 0, // Will be calculated from sub-categories
      length: 0,
      width: 0,
      height: 0,
      quantity: 0,
      amount: 0,
      subCategories: {
        create: [
          {
            categoryName: 'A: Lead upto 100 m',
            description: 'Loading materials with lead distance up to 100 meters',
            subItems: {
              create: [
                {
                  description: 'Lime, Moorum, Building rubbish and similar miscellaneous materials',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'M³',
                },
                {
                  description: 'Sand, Stone aggregate below 40 mm nominal size',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'M³',
                },
                {
                  description: 'Stone aggregate 40 mm nominal size and above',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'M³',
                },
                {
                  description: 'Bricks',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: '1000 nos.',
                },
                {
                  description: 'Cement',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'tonne',
                },
                {
                  description: 'Steel',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'tonne',
                },
                {
                  description: 'Tar, Bitumen etc.',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'tonne',
                },
              ],
            },
          },
        ],
      },
    },
  })

  // 2. Unloading materials from Railway Wagon (Item 1.02)
  const unloadingItem = await prisma.workItem.create({
    data: {
      estimateId: estimate.id,
      itemNo: 2,
      pageRef: '1/1.02',
      description: 'Unloading materials from Railway Wagon and loading into Truck including necessary carriage by head load within a lead of 50 m',
      unitId: units[0].id, // Cubic Meter
      rate: 0,
      length: 0,
      width: 0,
      height: 0,
      quantity: 0,
      amount: 0,
      subCategories: {
        create: [
          {
            categoryName: 'A: Lead upto 100 m',
            description: 'Unloading materials with lead distance up to 100 meters',
            subItems: {
              create: [
                {
                  description: 'Lime, Moorum, Building rubbish and similar miscellaneous materials',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'M³',
                },
                {
                  description: 'Sand, Stone aggregate below 40 mm nominal size',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'M³',
                },
                {
                  description: 'Stone aggregate 40 mm nominal size and above',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'M³',
                },
                {
                  description: 'Bricks',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: '1000 nos.',
                },
                {
                  description: 'Cement',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'tonne',
                },
                {
                  description: 'Steel',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'tonne',
                },
                {
                  description: 'Tar, Bitumen etc.',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'tonne',
                },
              ],
            },
          },
        ],
      },
    },
  })

  // 3. Site Clearance - Cutting of Trees (Item 2.01)
  const treeCuttingItem = await prisma.workItem.create({
    data: {
      estimateId: estimate.id,
      itemNo: 3,
      pageRef: '2/2.01',
      description: 'Cutting of Trees including Cutting of Trunks, Branches and Removal of Stumps',
      unitId: units[1].id, // Each
      rate: 0,
      length: 0,
      width: 0,
      height: 0,
      quantity: 0,
      amount: 0,
      subCategories: {
        create: [
          {
            categoryName: 'A: Lead upto 100 m',
            description: 'Tree cutting with lead distance up to 100 meters',
            subItems: {
              create: [
                {
                  description: 'Girth above 300 mm to 600 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 600 mm to 900 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 900 mm to 1800 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 1800 mm to 2700 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 2700 mm to 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
              ],
            },
          },
          {
            categoryName: 'B: Lead upto 1000 m',
            description: 'Tree cutting with lead distance up to 1000 meters',
            subItems: {
              create: [
                {
                  description: 'Girth above 300 mm to 600 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 600 mm to 900 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 900 mm to 1800 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 1800 mm to 2700 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 2700 mm to 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
              ],
            },
          },
        ],
      },
    },
  })

  // 4. Site Clearance - Uprooting and Removing Stumps (Item 2.02)
  const stumpRemovalItem = await prisma.workItem.create({
    data: {
      estimateId: estimate.id,
      itemNo: 4,
      pageRef: '2/2.02',
      description: 'Uprooting and Removing Stumps & Roots',
      unitId: units[1].id, // Each
      rate: 0,
      length: 0,
      width: 0,
      height: 0,
      quantity: 0,
      amount: 0,
      subCategories: {
        create: [
          {
            categoryName: 'A: Lead upto 100 m',
            description: 'Stump removal with lead distance up to 100 meters',
            subItems: {
              create: [
                {
                  description: 'Girth above 300 mm to 600 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 600 mm to 900 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 900 mm to 1800 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 1800 mm to 2700 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 2700 mm to 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
              ],
            },
          },
          {
            categoryName: 'B: Lead upto 1000 m',
            description: 'Stump removal with lead distance up to 1000 meters',
            subItems: {
              create: [
                {
                  description: 'Girth above 300 mm to 600 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 600 mm to 900 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 900 mm to 1800 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 1800 mm to 2700 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 2700 mm to 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
                {
                  description: 'Girth above 4500 mm',
                  nos: 1,
                  length: 1,
                  breadth: 1,
                  depth: 1,
                  quantity: 1,
                  unitSymbol: 'each',
                },
              ],
            },
          },
        ],
      },
    },
  })

  // 5. Create a simple work item with direct sub-items (not hierarchical)
  const simpleItem = await prisma.workItem.create({
    data: {
      estimateId: estimate.id,
      itemNo: 5,
      pageRef: '3/3.01',
      description: 'Loading, unloading and stacking by Manual Means',
      unitId: units[0].id, // Cubic Meter
      rate: 0,
      length: 0,
      width: 0,
      height: 0,
      quantity: 0,
      amount: 0,
      subItems: {
        create: [
          {
            description: 'Lime, Moorum, Building rubbish and similar miscellaneous materials',
            nos: 1,
            length: 1,
            breadth: 1,
            depth: 1,
            quantity: 1,
            unitSymbol: 'M³',
          },
          {
            description: 'Earth',
            nos: 1,
            length: 1,
            breadth: 1,
            depth: 1,
            quantity: 1,
            unitSymbol: 'M³',
          },
          {
            description: 'Sand, Stone aggregate below 40 mm nominal size',
            nos: 1,
            length: 1,
            breadth: 1,
            depth: 1,
            quantity: 1,
            unitSymbol: 'M³',
          },
          {
            description: 'Stone aggregate 40 mm nominal size and above',
            nos: 1,
            length: 1,
            breadth: 1,
            depth: 1,
            quantity: 1,
            unitSymbol: 'M³',
          },
          {
            description: 'Bricks',
            nos: 1,
            length: 1,
            breadth: 1,
            depth: 1,
            quantity: 1,
            unitSymbol: '1000 nos.',
          },
          {
            description: 'Stone blocks, G.I., C.I. pipes below 100 mm dia and other heavy material',
            nos: 1,
            length: 1,
            breadth: 1,
            depth: 1,
            quantity: 1,
            unitSymbol: 'tonne',
          },
        ],
      },
    },
  })

  // Create rate library entries for the sample items
  const rateLibraryEntries = [
    // Loading rates (Item 1.01)
    { description: 'Lime, Moorum, Building rubbish and similar miscellaneous materials - Loading', unitId: units[0].id, rate: 33.00 },
    { description: 'Sand, Stone aggregate below 40 mm nominal size - Loading', unitId: units[0].id, rate: 42.00 },
    { description: 'Stone aggregate 40 mm nominal size and above - Loading', unitId: units[0].id, rate: 45.00 },
    { description: 'Bricks - Loading', unitId: units[2].id, rate: 78.00 },
    { description: 'Cement - Loading', unitId: units[3].id, rate: 28.00 },
    { description: 'Steel - Loading', unitId: units[3].id, rate: 52.00 },
    { description: 'Tar, Bitumen etc. - Loading', unitId: units[3].id, rate: 30.00 },
    
    // Unloading rates (Item 1.02)
    { description: 'Lime, Moorum, Building rubbish and similar miscellaneous materials - Unloading', unitId: units[0].id, rate: 56.00 },
    { description: 'Sand, Stone aggregate below 40 mm nominal size - Unloading', unitId: units[0].id, rate: 70.00 },
    { description: 'Stone aggregate 40 mm nominal size and above - Unloading', unitId: units[0].id, rate: 76.00 },
    { description: 'Bricks - Unloading', unitId: units[2].id, rate: 131.00 },
    { description: 'Cement - Unloading', unitId: units[3].id, rate: 47.00 },
    { description: 'Steel - Unloading', unitId: units[3].id, rate: 87.00 },
    { description: 'Tar, Bitumen etc. - Unloading', unitId: units[3].id, rate: 51.00 },
    
    // Tree cutting rates (Item 2.01)
    { description: 'Girth above 300 mm to 600 mm - Tree Cutting (Lead upto 100 m)', unitId: units[1].id, rate: 211.00 },
    { description: 'Girth above 600 mm to 900 mm - Tree Cutting (Lead upto 100 m)', unitId: units[1].id, rate: 366.00 },
    { description: 'Girth above 900 mm to 1800 mm - Tree Cutting (Lead upto 100 m)', unitId: units[1].id, rate: 726.00 },
    { description: 'Girth above 1800 mm to 2700 mm - Tree Cutting (Lead upto 100 m)', unitId: units[1].id, rate: 1386.00 },
    { description: 'Girth above 2700 mm to 4500 mm - Tree Cutting (Lead upto 100 m)', unitId: units[1].id, rate: 2847.00 },
    { description: 'Girth above 4500 mm - Tree Cutting (Lead upto 100 m)', unitId: units[1].id, rate: 8365.00 },
    
    // Stump removal rates (Item 2.02)
    { description: 'Girth above 300 mm to 600 mm - Stump Removal (Lead upto 100 m)', unitId: units[1].id, rate: 127.00 },
    { description: 'Girth above 600 mm to 900 mm - Stump Removal (Lead upto 100 m)', unitId: units[1].id, rate: 202.00 },
    { description: 'Girth above 900 mm to 1800 mm - Stump Removal (Lead upto 100 m)', unitId: units[1].id, rate: 428.00 },
    { description: 'Girth above 1800 mm to 2700 mm - Stump Removal (Lead upto 100 m)', unitId: units[1].id, rate: 843.00 },
    { description: 'Girth above 2700 mm to 4500 mm - Stump Removal (Lead upto 100 m)', unitId: units[1].id, rate: 1699.00 },
    { description: 'Girth above 4500 mm - Stump Removal (Lead upto 100 m)', unitId: units[1].id, rate: 4806.00 },
    
    // Manual handling rates (Item 3.01)
    { description: 'Lime, Moorum, Building rubbish and similar miscellaneous materials - Manual Handling', unitId: units[0].id, rate: 62.00 },
    { description: 'Earth - Manual Handling', unitId: units[0].id, rate: 77.00 },
    { description: 'Sand, Stone aggregate below 40 mm nominal size - Manual Handling', unitId: units[0].id, rate: 77.00 },
    { description: 'Stone aggregate 40 mm nominal size and above - Manual Handling', unitId: units[0].id, rate: 83.00 },
    { description: 'Bricks - Manual Handling', unitId: units[2].id, rate: 144.00 },
    { description: 'Stone blocks, G.I., C.I. pipes below 100 mm dia and other heavy material - Manual Handling', unitId: units[3].id, rate: 56.00 },
  ]

  for (const rateData of rateLibraryEntries) {
    await prisma.rateLibrary.create({
      data: {
        ...rateData,
        year: '2018',
      },
    })
  }

  console.log('✅ Rate library entries created')
  console.log('✅ Hierarchical work items seeded successfully!')
  console.log(`📊 Created estimate: ${estimate.title}`)
  console.log(`📋 Created ${5} work items with hierarchical structure`)
  console.log(`📚 Created ${rateLibraryEntries.length} rate library entries`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
