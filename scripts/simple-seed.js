const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with hierarchical work items...')

  try {
    // Create units first
    const cubicMeter = await prisma.unitMaster.upsert({
      where: { unitName: 'Cubic Meter' },
      update: {},
      create: {
        unitName: 'Cubic Meter',
        unitSymbol: 'M³',
      },
    })

    const each = await prisma.unitMaster.upsert({
      where: { unitName: 'Each' },
      update: {},
      create: {
        unitName: 'Each',
        unitSymbol: 'each',
      },
    })

    const thousand = await prisma.unitMaster.upsert({
      where: { unitName: 'Thousand Numbers' },
      update: {},
      create: {
        unitName: 'Thousand Numbers',
        unitSymbol: '1000 nos.',
      },
    })

    const tonne = await prisma.unitMaster.upsert({
      where: { unitName: 'Tonne' },
      update: {},
      create: {
        unitName: 'Tonne',
        unitSymbol: 'tonne',
      },
    })

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

    // Create a simple work item first (without sub-categories)
    const simpleItem = await prisma.workItem.create({
      data: {
        estimateId: estimate.id,
        itemNo: 1,
        pageRef: '1/1.01',
        description: 'Loading materials into Railway Wagon',
        unitId: cubicMeter.id,
        rate: 50.0,
        length: 1,
        width: 1,
        height: 1,
        quantity: 1,
        amount: 50.0,
        subItems: {
          create: [
            {
              description: 'Lime, Moorum, Building rubbish',
              nos: 1,
              length: 1,
              breadth: 1,
              depth: 1,
              quantity: 1,
              unitSymbol: 'M³',
            },
            {
              description: 'Sand, Stone aggregate',
              nos: 1,
              length: 1,
              breadth: 1,
              depth: 1,
              quantity: 1,
              unitSymbol: 'M³',
            },
          ],
        },
      },
    })

    console.log('✅ Simple work item created')

    // Create rate library entries
    await prisma.rateLibrary.create({
      data: {
        description: 'Lime, Moorum, Building rubbish - Loading',
        unitId: cubicMeter.id,
        standardRate: 33.00,
        year: '2018',
      },
    })

    await prisma.rateLibrary.create({
      data: {
        description: 'Sand, Stone aggregate - Loading',
        unitId: cubicMeter.id,
        standardRate: 42.00,
        year: '2018',
      },
    })

    console.log('✅ Rate library entries created')
    console.log('✅ Database seeded successfully!')
    console.log(`📊 Created estimate: ${estimate.title}`)
    console.log(`📋 Created 1 work item`)
    console.log(`📚 Created 2 rate library entries`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
