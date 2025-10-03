import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const rateLibraryItems = [
  // Earthwork
  { description: "Excavation in ordinary soil", unitName: "Cubic Meter", standardRate: 150.0 },
  { description: "Excavation in hard soil", unitName: "Cubic Meter", standardRate: 200.0 },
  { description: "Filling with excavated earth", unitName: "Cubic Meter", standardRate: 80.0 },
  { description: "Filling with sand", unitName: "Cubic Meter", standardRate: 450.0 },
  { description: "Compaction with mechanical rammer", unitName: "Cubic Meter", standardRate: 120.0 },

  // Concrete Work
  { description: "PCC 1:4:8 (100mm thick)", unitName: "Cubic Meter", standardRate: 4500.0 },
  { description: "RCC M20 for foundation", unitName: "Cubic Meter", standardRate: 6500.0 },
  { description: "RCC M25 for columns", unitName: "Cubic Meter", standardRate: 7200.0 },
  { description: "RCC M25 for beams", unitName: "Cubic Meter", standardRate: 7200.0 },
  { description: "RCC M25 for slabs", unitName: "Cubic Meter", standardRate: 7000.0 },
  { description: "RCC M30 for special structures", unitName: "Cubic Meter", standardRate: 8000.0 },

  // Reinforcement
  { description: "TMT bars 8mm dia", unitName: "Kilogram", standardRate: 65.0 },
  { description: "TMT bars 10mm dia", unitName: "Kilogram", standardRate: 64.0 },
  { description: "TMT bars 12mm dia", unitName: "Kilogram", standardRate: 63.0 },
  { description: "TMT bars 16mm dia", unitName: "Kilogram", standardRate: 62.0 },
  { description: "TMT bars 20mm dia", unitName: "Kilogram", standardRate: 61.0 },
  { description: "TMT bars 25mm dia", unitName: "Kilogram", standardRate: 60.0 },
  { description: "Binding wire", unitName: "Kilogram", standardRate: 80.0 },

  // Formwork
  { description: "Formwork for foundation", unitName: "Square Meter", standardRate: 350.0 },
  { description: "Formwork for columns", unitName: "Square Meter", standardRate: 450.0 },
  { description: "Formwork for beams", unitName: "Square Meter", standardRate: 420.0 },
  { description: "Formwork for slabs", unitName: "Square Meter", standardRate: 380.0 },

  // Brickwork
  { description: "Brickwork in CM 1:6 (230mm thick)", unitName: "Cubic Meter", standardRate: 5500.0 },
  { description: "Brickwork in CM 1:4 (115mm thick)", unitName: "Cubic Meter", standardRate: 5200.0 },
  { description: "Hollow block work (200mm)", unitName: "Square Meter", standardRate: 850.0 },
  { description: "AAC block work (200mm)", unitName: "Square Meter", standardRate: 950.0 },

  // Plastering
  { description: "Internal plastering 12mm thick CM 1:4", unitName: "Square Meter", standardRate: 280.0 },
  { description: "External plastering 15mm thick CM 1:4", unitName: "Square Meter", standardRate: 320.0 },
  { description: "Ceiling plastering 12mm thick", unitName: "Square Meter", standardRate: 300.0 },
  { description: "Gypsum plastering 12mm", unitName: "Square Meter", standardRate: 350.0 },

  // Flooring
  { description: "Vitrified tiles 600x600mm", unitName: "Square Meter", standardRate: 850.0 },
  { description: "Ceramic tiles 300x300mm", unitName: "Square Meter", standardRate: 650.0 },
  { description: "Marble flooring 20mm thick", unitName: "Square Meter", standardRate: 1800.0 },
  { description: "Granite flooring 20mm thick", unitName: "Square Meter", standardRate: 1500.0 },
  { description: "Cement concrete flooring 40mm", unitName: "Square Meter", standardRate: 450.0 },

  // Painting
  { description: "Internal emulsion paint (2 coats)", unitName: "Square Meter", standardRate: 85.0 },
  { description: "External emulsion paint (2 coats)", unitName: "Square Meter", standardRate: 95.0 },
  { description: "Enamel paint on wood (2 coats)", unitName: "Square Meter", standardRate: 120.0 },
  { description: "Distemper paint (2 coats)", unitName: "Square Meter", standardRate: 65.0 },
  { description: "Texture paint", unitName: "Square Meter", standardRate: 150.0 },

  // Doors & Windows
  { description: "Teak wood door frame", unitName: "Cubic Meter", standardRate: 45000.0 },
  { description: "Teak wood door shutter", unitName: "Square Meter", standardRate: 8500.0 },
  { description: "UPVC window with glass", unitName: "Square Meter", standardRate: 1800.0 },
  { description: "Aluminum sliding window", unitName: "Square Meter", standardRate: 1500.0 },
  { description: "MS grill work", unitName: "Kilogram", standardRate: 95.0 },

  // Waterproofing
  { description: "Waterproofing with bitumen", unitName: "Square Meter", standardRate: 280.0 },
  { description: "Waterproofing with APP membrane", unitName: "Square Meter", standardRate: 450.0 },
  { description: "Waterproofing with chemical coating", unitName: "Square Meter", standardRate: 320.0 },

  // Plumbing
  { description: "CPVC pipe 15mm", unitName: "Meter", standardRate: 85.0 },
  { description: "CPVC pipe 20mm", unitName: "Meter", standardRate: 110.0 },
  { description: "PVC pipe 110mm (drainage)", unitName: "Meter", standardRate: 180.0 },
  { description: "Water closet (EWC)", unitName: "Numbers", standardRate: 8500.0 },
  { description: "Wash basin with fittings", unitName: "Numbers", standardRate: 4500.0 },

  // Electrical
  { description: "PVC conduit 20mm", unitName: "Meter", standardRate: 45.0 },
  { description: "Copper wire 2.5 sq.mm", unitName: "Meter", standardRate: 28.0 },
  { description: "Copper wire 4 sq.mm", unitName: "Meter", standardRate: 42.0 },
  { description: "Modular switch 6A", unitName: "Numbers", standardRate: 180.0 },
  { description: "LED light 15W", unitName: "Numbers", standardRate: 450.0 },
  { description: "MCB 32A", unitName: "Numbers", standardRate: 280.0 },

  // Steel Work
  { description: "Structural steel fabrication", unitName: "Kilogram", standardRate: 85.0 },
  { description: "MS angle 50x50x6mm", unitName: "Kilogram", standardRate: 75.0 },
  { description: "MS channel 100mm", unitName: "Kilogram", standardRate: 78.0 },

  // Miscellaneous
  { description: "Scaffolding rental per month", unitName: "Square Meter", standardRate: 35.0 },
  { description: "Curing of concrete", unitName: "Square Meter", standardRate: 15.0 },
  { description: "Debris removal", unitName: "Cubic Meter", standardRate: 180.0 },
]

async function main() {
  console.log("Seeding Rate Library...")

  const units = await prisma.unitMaster.findMany()
  const unitMap = new Map(units.map((u) => [u.unitName, u.id]))

  let successCount = 0
  let errorCount = 0

  for (const item of rateLibraryItems) {
    const unitId = unitMap.get(item.unitName)

    if (!unitId) {
      console.warn(`⚠️  Unit not found: ${item.unitName} for item: ${item.description}`)
      errorCount++
      continue
    }

    try {
      await prisma.rateLibrary.create({
        data: {
          description: item.description,
          unitId: unitId,
          standardRate: item.standardRate,
          year: "2024",
        },
      })
      successCount++
    } catch (error) {
      console.error(`Error creating item: ${item.description}`, error)
      errorCount++
    }
  }

  console.log(`✅ Successfully seeded ${successCount} rate library items!`)
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} items failed to seed`)
  }
}

main()
  .catch((e) => {
    console.error("Error seeding rate library:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
