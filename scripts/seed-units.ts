import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const defaultUnits = [
  { unitName: "Meter", unitSymbol: "m" },
  { unitName: "Square Meter", unitSymbol: "m²" },
  { unitName: "Cubic Meter", unitSymbol: "m³" },
  { unitName: "Kilometer", unitSymbol: "km" },
  { unitName: "Hectare", unitSymbol: "ha" },
  { unitName: "Kilogram", unitSymbol: "kg" },
  { unitName: "Quintal", unitSymbol: "quintal" },
  { unitName: "Ton", unitSymbol: "ton" },
  { unitName: "Metric Ton", unitSymbol: "mt" },
  { unitName: "Bag", unitSymbol: "bag" },
  { unitName: "Drum", unitSymbol: "drum" },
  { unitName: "Litre", unitSymbol: "litre" },
  { unitName: "Millilitre", unitSymbol: "ml" },
  { unitName: "Numbers", unitSymbol: "nos" },
  { unitName: "Set", unitSymbol: "set" },
  { unitName: "Bundle", unitSymbol: "bundle" },
  { unitName: "Roll", unitSymbol: "roll" },
  { unitName: "Day", unitSymbol: "day" },
  { unitName: "Job", unitSymbol: "job" },
  { unitName: "Lump Sum", unitSymbol: "LS" },
]

async function main() {
  console.log("Seeding Unit Master...")

  for (const unit of defaultUnits) {
    await prisma.unitMaster.upsert({
      where: { unitName: unit.unitName },
      update: {},
      create: unit,
    })
  }

  console.log("Unit Master seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
