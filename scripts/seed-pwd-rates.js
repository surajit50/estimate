const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PWD Schedule of Rates seed process...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.subWorkItem.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.rateLibrary.deleteMany();
  await prisma.unitMaster.deleteMany();

  // Create Unit Master data based on PWD rates
  console.log('📏 Creating unit master data from PWD rates...');
  const units = await Promise.all([
    prisma.unitMaster.create({
      data: {
        unitName: 'Cubic Meter',
        unitSymbol: 'cum'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Square Meter',
        unitSymbol: 'sqm'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Meter',
        unitSymbol: 'm'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Running Meter',
        unitSymbol: 'rm'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Number',
        unitSymbol: 'each'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Metric Ton',
        unitSymbol: 'MT'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Hectare',
        unitSymbol: 'ha'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: '1000 Numbers',
        unitSymbol: '1000 nos'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: '100 Meter',
        unitSymbol: '100 mtr'
      }
    }),
    prisma.unitMaster.create({
      data: {
        unitName: 'Kilogram',
        unitSymbol: 'kg'
      }
    })
  ]);

  // Create Rate Library data from PWD Schedule of Rates 2018
  console.log('💰 Creating rate library data from PWD rates...');
  
  // Chapter 1: Carriage of Materials
  const carriageRates = await Promise.all([
    // Loading materials into Railway Wagon
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Lime, Moorum, Building rubbish',
        unitId: units[0].id, // cum
        standardRate: 33.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Sand, Stone aggregate below 40mm',
        unitId: units[0].id, // cum
        standardRate: 42.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Stone aggregate 40mm and above',
        unitId: units[0].id, // cum
        standardRate: 45.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Bricks',
        unitId: units[7].id, // 1000 nos
        standardRate: 78.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Cement',
        unitId: units[5].id, // MT
        standardRate: 28.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Steel',
        unitId: units[5].id, // MT
        standardRate: 52.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Loading materials into Railway Wagon - Tar, Bitumen',
        unitId: units[5].id, // MT
        standardRate: 30.00,
        year: '2018'
      }
    })
  ]);

  // Chapter 2: Site Clearance
  const siteClearanceRates = await Promise.all([
    // Tree cutting rates
    prisma.rateLibrary.create({
      data: {
        description: 'Cutting of Trees - Girth above 300mm to 600mm (Lead upto 100m)',
        unitId: units[4].id, // each
        standardRate: 211.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Cutting of Trees - Girth above 600mm to 900mm (Lead upto 100m)',
        unitId: units[4].id, // each
        standardRate: 366.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Cutting of Trees - Girth above 900mm to 1800mm (Lead upto 100m)',
        unitId: units[4].id, // each
        standardRate: 726.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Cutting of Trees - Girth above 1800mm to 2700mm (Lead upto 100m)',
        unitId: units[4].id, // each
        standardRate: 1386.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Cutting of Trees - Girth above 2700mm to 4500mm (Lead upto 100m)',
        unitId: units[4].id, // each
        standardRate: 2847.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Cutting of Trees - Girth above 4500mm (Lead upto 100m)',
        unitId: units[4].id, // each
        standardRate: 8365.00,
        year: '2018'
      }
    }),
    // Clearing and grubbing
    prisma.rateLibrary.create({
      data: {
        description: 'Clearing and Grubbing Road Land - Non-thorny jungle (Manual)',
        unitId: units[6].id, // ha
        standardRate: 44978.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Clearing and Grubbing Road Land - Thorny jungle (Manual)',
        unitId: units[6].id, // ha
        standardRate: 60286.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Clearing and Grubbing Road Land - Non-thorny jungle (Mechanical)',
        unitId: units[6].id, // ha
        standardRate: 23363.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Clearing and Grubbing Road Land - Thorny jungle (Mechanical)',
        unitId: units[6].id, // ha
        standardRate: 28533.00,
        year: '2018'
      }
    })
  ]);

  // Chapter 3: Earth Work
  const earthworkRates = await Promise.all([
    // Earthwork excavation
    prisma.rateLibrary.create({
      data: {
        description: 'Earthwork in excavation from borrow pits - Ordinary soil',
        unitId: units[0].id, // cum
        standardRate: 89.90,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Earthwork in excavation from borrow pits - Mixed soil',
        unitId: units[0].id, // cum
        standardRate: 99.90,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Earthwork in excavation from borrow pits - Mixed hard soil',
        unitId: units[0].id, // cum
        standardRate: 119.90,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Earthwork in cutting to form road section - Ordinary soil',
        unitId: units[0].id, // cum
        standardRate: 79.90,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Earthwork in cutting to form road section - Mixed soil',
        unitId: units[0].id, // cum
        standardRate: 89.90,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Earthwork in cutting to form road section - Mixed hard soil',
        unitId: units[0].id, // cum
        standardRate: 109.90,
        year: '2018'
      }
    }),
    // Excavation with hydraulic excavator
    prisma.rateLibrary.create({
      data: {
        description: 'Excavation in Soil using Hydraulic Excavator CK 90',
        unitId: units[0].id, // cum
        standardRate: 37.30,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Excavation in Ordinary Rock using Hydraulic Excavator CK-90',
        unitId: units[0].id, // cum
        standardRate: 49.20,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Excavation in Hard Rock (blasting prohibited)',
        unitId: units[0].id, // cum
        standardRate: 431.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Excavation in Marshy Soil',
        unitId: units[0].id, // cum
        standardRate: 41.00,
        year: '2018'
      }
    }),
    // Embankment construction
    prisma.rateLibrary.create({
      data: {
        description: 'Construction of Embankment with Material from Borrow Pits',
        unitId: units[0].id, // cum
        standardRate: 85.60,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Construction of Embankment with Material from Roadway Cutting',
        unitId: units[0].id, // cum
        standardRate: 46.80,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Construction of Subgrade and Earthen Shoulders',
        unitId: units[0].id, // cum
        standardRate: 94.80,
        year: '2018'
      }
    }),
    // Drainage works
    prisma.rateLibrary.create({
      data: {
        description: 'Surface Drains in Soil',
        unitId: units[2].id, // m
        standardRate: 49.30,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Sub Surface Drains with Perforated Pipe',
        unitId: units[2].id, // m
        standardRate: 566.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Aggregate Sub- Surface Drains',
        unitId: units[2].id, // m
        standardRate: 259.00,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Underground Drain at Edge of Pavement',
        unitId: units[2].id, // m
        standardRate: 3044.00,
        year: '2018'
      }
    }),
    // Erosion control
    prisma.rateLibrary.create({
      data: {
        description: 'Turfing with Sods',
        unitId: units[1].id, // sqm
        standardRate: 17.20,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Seeding and Mulching',
        unitId: units[1].id, // sqm
        standardRate: 87.30,
        year: '2018'
      }
    }),
    prisma.rateLibrary.create({
      data: {
        description: 'Supplying and laying open mesh Jute Geotextile (JGT)',
        unitId: units[1].id, // sqm
        standardRate: 29.60,
        year: '2018'
      }
    })
  ]);

  // Create Sample Estimates based on PWD projects
  console.log('🏗️ Creating sample estimates based on PWD projects...');
  
  // Estimate 1: Rural Road Construction
  const estimate1 = await prisma.estimate.create({
    data: {
      title: 'Rural Road Construction - PWD Project',
      category: 'Rural Infrastructure',
      description: 'Construction of 5 km rural road with embankment, drainage and erosion control',
      location: 'West Bengal, India',
      activityCode: 'PWD-RR-2024-001',
      parameters: {
        roadLength: '5.0 km',
        roadWidth: '3.75 m',
        embankmentHeight: '1.5 m',
        drainageLength: '2.0 km',
        projectType: 'Rural Road as per MORD specifications'
      },
    }
  });

  // Estimate 2: Bridge Approach Road
  const estimate2 = await prisma.estimate.create({
    data: {
      title: 'Bridge Approach Road Construction',
      category: 'Bridge Infrastructure',
      description: 'Construction of approach roads for bridge with heavy earthwork and drainage',
      location: 'Darjeeling Hill Area, West Bengal',
      activityCode: 'PWD-BR-2024-002',
      parameters: {
        approachLength: '2.0 km',
        bridgeSpan: '50 m',
        embankmentHeight: '3.0 m',
        slopeProtection: 'Jute Geotextile',
        projectType: 'Bridge Approach as per MORT&H specifications'
      },
      
    }
  });

  // Create Work Items for Rural Road Construction
  console.log('📋 Creating work items for rural road construction...');
  
  // Site clearance work items
  const workItem1 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 1,
      pageRef: '2.01',
      description: 'Clearing and Grubbing Road Land - Non-thorny jungle (Manual)',
      unitId: units[6].id, // ha
      rate: 44978.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 0.5, // 0.5 hectare
      amount: 22489.00
    }
  });

  const workItem2 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 2,
      pageRef: '2.01',
      description: 'Cutting of Trees - Girth above 300mm to 600mm',
      unitId: units[4].id, // each
      rate: 211.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 25.0, // 25 trees
      amount: 5275.00
    }
  });

  // Earthwork items
  const workItem3 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 3,
      pageRef: '3.01',
      description: 'Earthwork in excavation from borrow pits - Ordinary soil',
      unitId: units[0].id, // cum
      rate: 89.90,
      length: 0,
      width: 0,
      height: 0,
      quantity: 500.0, // 500 cum
      amount: 44950.00
    }
  });

  const workItem4 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 4,
      pageRef: '3.11',
      description: 'Construction of Embankment with Material from Borrow Pits',
      unitId: units[0].id, // cum
      rate: 85.60,
      length: 0,
      width: 0,
      height: 0,
      quantity: 500.0, // 500 cum
      amount: 42800.00
    }
  });

  const workItem5 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 5,
      pageRef: '3.14',
      description: 'Construction of Subgrade and Earthen Shoulders',
      unitId: units[0].id, // cum
      rate: 94.80,
      length: 0,
      width: 0,
      height: 0,
      quantity: 200.0, // 200 cum
      amount: 18960.00
    }
  });

  // Drainage work items
  const workItem6 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 6,
      pageRef: '3.22',
      description: 'Surface Drains in Soil',
      unitId: units[2].id, // m
      rate: 49.30,
      length: 0,
      width: 0,
      height: 0,
      quantity: 2000.0, // 2000 m
      amount: 98600.00
    }
  });

  const workItem7 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 7,
      pageRef: '3.24',
      description: 'Aggregate Sub- Surface Drains',
      unitId: units[2].id, // m
      rate: 259.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 500.0, // 500 m
      amount: 129500.00
    }
  });

  // Erosion control items
  const workItem8 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 8,
      pageRef: '3.20',
      description: 'Turfing with Sods',
      unitId: units[1].id, // sqm
      rate: 17.20,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1000.0, // 1000 sqm
      amount: 17200.00
    }
  });

  const workItem9 = await prisma.workItem.create({
    data: {
      estimateId: estimate1.id,
      itemNo: 9,
      pageRef: '3.30',
      description: 'Supplying and laying open mesh Jute Geotextile (JGT)',
      unitId: units[1].id, // sqm
      rate: 29.60,
      length: 0,
      width: 0,
      height: 0,
      quantity: 500.0, // 500 sqm
      amount: 14800.00
    }
  });

  // Create Work Items for Bridge Approach Road
  console.log('📋 Creating work items for bridge approach road...');
  
  const workItem10 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 1,
      pageRef: '3.01',
      description: 'Earthwork in excavation from borrow pits - Mixed hard soil',
      unitId: units[0].id, // cum
      rate: 119.90,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1000.0, // 1000 cum
      amount: 119900.00
    }
  });

  const workItem11 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 2,
      pageRef: '3.08',
      description: 'Excavation in Hard Rock (blasting prohibited)',
      unitId: units[0].id, // cum
      rate: 431.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 200.0, // 200 cum
      amount: 86200.00
    }
  });

  const workItem12 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 3,
      pageRef: '3.25',
      description: 'Underground Drain at Edge of Pavement',
      unitId: units[2].id, // m
      rate: 3044.00,
      length: 0,
      width: 0,
      height: 0,
      quantity: 100.0, // 100 m
      amount: 304400.00
    }
  });

  const workItem13 = await prisma.workItem.create({
    data: {
      estimateId: estimate2.id,
      itemNo: 4,
      pageRef: '3.21',
      description: 'Seeding and Mulching',
      unitId: units[1].id, // sqm
      rate: 87.30,
      length: 0,
      width: 0,
      height: 0,
      quantity: 2000.0, // 2000 sqm
      amount: 174600.00
    }
  });

  // Create SubCategories for Earthwork (Work Item 3)
  console.log('📂 Creating sub-categories for earthwork...');
  const subCategory1 = await prisma.subCategory.create({
    data: {
      workItemId: workItem3.id,
      categoryName: 'A: Lead upto 50 m',
      description: 'Earthwork excavation with lead distance up to 50 meters'
    }
  });

  const subCategory2 = await prisma.subCategory.create({
    data: {
      workItemId: workItem3.id,
      categoryName: 'B: Lead 50m to 200m',
      description: 'Earthwork excavation with lead distance 50m to 200m'
    }
  });

  // Create SubWorkItems for SubCategory 1
  console.log('🔧 Creating sub-work items for earthwork...');
  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem3.id,
      subCategoryId: subCategory1.id,
      description: 'Ordinary soil excavation',
      nos: 1,
      length: 100.0,
      breadth: 3.75,
      depth: 1.0,
      quantity: 375.0,
      unitSymbol: 'cum'
    }
  });

  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem3.id,
      subCategoryId: subCategory1.id,
      description: 'Mixed soil excavation',
      nos: 1,
      length: 50.0,
      breadth: 3.75,
      depth: 0.5,
      quantity: 93.75,
      unitSymbol: 'cum'
    }
  });

  // Create SubWorkItems for SubCategory 2
  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem3.id,
      subCategoryId: subCategory2.id,
      description: 'Extra carriage for additional lead',
      nos: 1,
      length: 31.25,
      breadth: 1.0,
      depth: 1.0,
      quantity: 31.25,
      unitSymbol: 'cum'
    }
  });

  // Create SubCategories for Drainage (Work Item 6)
  const subCategory3 = await prisma.subCategory.create({
    data: {
      workItemId: workItem6.id,
      categoryName: 'A: Left side drain',
      description: 'Surface drain on left side of road'
    }
  });

  const subCategory4 = await prisma.subCategory.create({
    data: {
      workItemId: workItem6.id,
      categoryName: 'B: Right side drain',
      description: 'Surface drain on right side of road'
    }
  });

  // Create SubWorkItems for drainage
  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem6.id,
      subCategoryId: subCategory3.id,
      description: 'Unlined surface drain 0.40 sqm cross-section',
      nos: 1,
      length: 1000.0,
      breadth: 0.4,
      depth: 1.0,
      quantity: 400.0,
      unitSymbol: 'cum'
    }
  });

  await prisma.subWorkItem.create({
    data: {
      workItemId: workItem6.id,
      subCategoryId: subCategory4.id,
      description: 'Unlined surface drain 0.40 sqm cross-section',
      nos: 1,
      length: 1000.0,
      breadth: 0.4,
      depth: 1.0,
      quantity: 400.0,
      unitSymbol: 'cum'
    }
  });

  console.log('✅ PWD Schedule of Rates seed data created successfully!');
  console.log(`📊 Summary:`);
  console.log(`- ${units.length} units created`);
  console.log(`- ${carriageRates.length + siteClearanceRates.length + earthworkRates.length} rates created`);
  console.log(`- 2 estimates created (Rural Road & Bridge Approach)`);
  console.log(`- 13 work items created`);
  console.log(`- 4 sub-categories created`);
  console.log(`- 5 sub-work items created`);
  console.log(`\n🏗️ Project Details:`);
  console.log(`- Rural Road: 5km with embankment, drainage & erosion control`);
  console.log(`- Bridge Approach: 2km with heavy earthwork & underground drainage`);
  console.log(`\n📋 Work Items Include:`);
  console.log(`- Site clearance (tree cutting, grubbing)`);
  console.log(`- Earthwork (excavation, embankment, subgrade)`);
  console.log(`- Drainage (surface & subsurface drains)`);
  console.log(`- Erosion control (turfing, geotextile)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
