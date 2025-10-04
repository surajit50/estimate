const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.subWorkItem.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.rateLibrary.deleteMany();
  await prisma.unitMaster.deleteMany();

  // Create Unit Master data
  console.log('📏 Creating unit master data...');
  const units = await Promise.all([
    prisma.unitMaster.create({
      data: {
        unitName: 'Cubic Meter',
        unitSymbol: 'M³'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Square Meter',
        unitSymbol: 'M²'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Meter',
        unitSymbol: 'M'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Number',
        unitSymbol: 'Nos'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Kilogram',
        unitSymbol: 'Kg'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Liter',
        unitSymbol: 'L'
      }
    })
  ]);

  // Create Rate Library data
  console.log('💰 Creating rate library data...');
  const rates = await Promise.all([
    // Concrete rates
    prisma.rateLibrary.create({
      data: {
        description: 'M20 Grade Concrete',
        unitId: units[0].id, // M³
        standardRate: 4500.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'M25 Grade Concrete',
        unitId: units[0].id, // M³
        standardRate: 4800.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'M30 Grade Concrete',
        unitId: units[0].id, // M³
        standardRate: 5200.00,
        year: '2024'
      }
    }),
    // Reinforcement rates
    prisma.rateLibrary.create({
      data: {
        description: 'Steel Reinforcement (Fe 415)',
        unitId: units[4].id, // Kg
        standardRate: 85.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Steel Reinforcement (Fe 500)',
        unitId: units[4].id, // Kg
        standardRate: 90.00,
        year: '2024'
      }
    }),
    // Brickwork rates
    prisma.rateLibrary.create({
      data: {
        description: 'Brickwork in CM 1:6',
        unitId: units[0].id, // M³
        standardRate: 3500.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Brickwork in CM 1:4',
        unitId: units[0].id, // M³
        standardRate: 3800.00,
        year: '2024'
      }
    }),
    // Plastering rates
    prisma.rateLibrary.create({
      data: {
        description: 'Cement Plaster 12mm thick',
        unitId: units[1].id, // M²
        standardRate: 180.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Cement Plaster 20mm thick',
        unitId: units[1].id, // M²
        standardRate: 280.00,
        year: '2024'
      }
    }),
    // Flooring rates
    prisma.rateLibrary.create({
      data: {
        description: 'Vitrified Tiles 600x600mm',
        unitId: units[1].id, // M²
        standardRate: 120.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Marble Flooring',
        unitId: units[1].id, // M²
        standardRate: 450.00,
        year: '2024'
      }
    }),
    // Painting rates
    prisma.rateLibrary.create({
      data: {
        description: 'Emulsion Paint (2 coats)',
        unitId: units[1].id, // M²
        standardRate: 35.00,
        year: '2024'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Enamel Paint (2 coats)',
        unitId: units[1].id, // M²
        standardRate: 45.00,
        year: '2024'
      }
    })
  ]);

  // Create Sample Estimates
  console.log('🏗️ Creating sample estimates...');
  
  // Estimate 1: Residential Building
  const estimate1 = await prisma.estimate.create({
    data: {
      title: 'Residential Building Construction',
      category: 'Residential',
      description: 'Construction of 2 BHK residential building with RCC structure',
      location: 'Mumbai, Maharashtra',
      activityCode: 'RES-2024-001',
      parameters: {
        plotArea: '1200 sq ft',
        builtUpArea: '1000 sq ft',
        floors: 2,
        foundation: 'RCC',
        structure: 'RCC Frame'
      },
      cgstPercent: 9.0,
      sgstPercent: 9.0,
      cessPercent: 1.0,
      contingency: 5.0
    }
  });

  // Estimate 2: Commercial Building
  const estimate2 = await prisma.estimate.create({
    data: {
      title: 'Office Building Construction',
      category: 'Commercial',
      description: 'Construction of 5-story office building with modern amenities',
      location: 'Delhi, NCR',
      activityCode: 'COM-2024-002',
      parameters: {
        plotArea: '5000 sq ft',
        builtUpArea: '20000 sq ft',
        floors: 5,
        foundation: 'RCC',
        structure: 'RCC Frame',
        parking: 'Basement + Ground'
      },
      cgstPercent: 9.0,
      sgstPercent: 9.0,
      cessPercent: 1.0,
      contingency: 8.0
    }
  });

  // Create Work Items for Estimate 1
  console.log('📋 Creating work items for residential building...');
  
  // Work Item 1: Foundation
  const workItem1 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 1,
      pageRef: '1/1',
      description: 'Excavation for foundation',
      unitId: units[0].id, // M³
      rate: 150.00,
      length: 20.0,
      width: 1.0,
      height: 1.5,
      quantity: 30.0,
      amount: 4500.00
    }
  });

  // Work Item 2: Concrete Work
  const workItem2 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 2,
      pageRef: '1/2',
      description: 'M25 Grade Concrete for foundation',
      unitId: units[0].id, // M³
      rate: 4800.00,
      length: 20.0,
      width: 1.0,
      height: 0.3,
      quantity: 6.0,
      amount: 28800.00
    }
  });

  // Work Item 3: Reinforcement
  const workItem3 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 3,
      pageRef: '1/3',
      description: 'Steel reinforcement for foundation',
      unitId: units[4].id, // Kg
      rate: 85.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 500.0,
      amount: 42500.00
    }
  });

  // Work Item 4: Brickwork
  const workItem4 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 4,
      pageRef: '2/1',
      description: 'Brickwork in CM 1:6 for walls',
      unitId: units[0].id, // M³
      rate: 3500.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 25.0,
      amount: 87500.00
    }
  });

  // Work Item 5: Plastering
  const workItem5 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 5,
      pageRef: '2/2',
      description: 'Cement plaster 12mm thick',
      unitId: units[1].id, // M²
      rate: 180.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 200.0,
      amount: 36000.00
    }
  });

  // Work Item 6: Flooring
  const workItem6 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 6,
      pageRef: '3/1',
      description: 'Vitrified tiles 600x600mm',
      unitId: units[1].id, // M²
      rate: 120.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 100.0,
      amount: 12000.00
    }
  });

  // Work Item 7: Painting
  const workItem7 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 7,
      pageRef: '3/2',
      description: 'Emulsion paint (2 coats)',
      unitId: units[1].id, // M²
      rate: 35.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 150.0,
      amount: 5250.00
    }
  });

  // Create SubCategories for Work Item 4 (Brickwork)
  console.log('📂 Creating sub-categories for brickwork...');
  const subCategory1 = await prisma.subCategory.create({
    data: {
      workItemId: workItem4.id,
      categoryName: 'A: Lead upto 100 m',
      description: 'Brickwork with lead distance up to 100 meters'
    }
  });

  const subCategory2 = await prisma.subCategory.create({
    data: {
      workItemId: workItem4.id,
      categoryName: 'B: Lead upto 1000 m',
      description: 'Brickwork with lead distance up to 1000 meters'
    }
  });

  // Create SubWorkItems for SubCategory 1
  console.log('🔧 Creating sub-work items...');
  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem4.id,
      subCategoryId: subCategory1.id,
      description: 'Girth above 300 mm to 600 mm',
      nos: 1,
      length: 20.0,
      breadth: 0.23,
      depth: 3.0,
      quantity: 13.8,
      unitSymbol: 'M³'
    }
  });

  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem4.id,
      subCategoryId: subCategory1.id,
      description: 'In Foundation',
      nos: 1,
      length: 20.0,
      breadth: 0.23,
      depth: 0.6,
      quantity: 2.76,
      unitSymbol: 'M³'
    }
  });

  // Create SubWorkItems for SubCategory 2
  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem4.id,
      subCategoryId: subCategory2.id,
      description: 'Girth above 600 mm to 1000 mm',
      nos: 1,
      length: 15.0,
      breadth: 0.23,
      depth: 2.5,
      quantity: 8.625,
      unitSymbol: 'M³'
    }
  });

  // Create Work Items for Estimate 2 (Commercial Building)
  console.log('📋 Creating work items for commercial building...');
  
  const workItem8 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 1,
      pageRef: '1/1',
      description: 'M30 Grade Concrete for columns',
      unitId: units[0].id, // M³
      rate: 5200.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 50.0,
      amount: 260000.00
    }
  });

  const workItem9 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 2,
      pageRef: '1/2',
      description: 'Steel reinforcement for columns',
      unitId: units[4].id, // Kg
      rate: 90.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 2500.0,
      amount: 225000.00
    }
  });

  const workItem10 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 3,
      pageRef: '2/1',
      description: 'Marble flooring for lobby',
      unitId: units[1].id, // M²
      rate: 450.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 200.0,
      amount: 90000.00
    }
  });

  const workItem11 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 4,
      pageRef: '2/2',
      description: 'Enamel paint for exterior walls',
      unitId: units[1].id, // M²
      rate: 45.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 500.0,
      amount: 22500.00
    }
  });

  console.log('✅ Seed data created successfully!');
  console.log(`📊 Summary:`);
  console.log(`- ${units.length} units created`);
  console.log(`- ${rates.length} rates created`);
  console.log(`- 2 estimates created`);
  console.log(`- 11 work items created`);
  console.log(`- 2 sub-categories created`);
  console.log(`- 3 sub-work items created`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
