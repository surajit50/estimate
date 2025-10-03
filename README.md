# Estimate Preparation System

A comprehensive web application for preparing construction estimates with automatic calculations, rate libraries, and export capabilities.

## Features

### Core Functionality
- **Dashboard**: View all estimates with filtering and search
- **Estimate Management**: Create, edit, and delete estimates with categories
- **Work Items**: Add work items with automatic quantity and amount calculations
- **Unit Master**: Manage measurement units (m, m², m³, kg, etc.)
- **Rate Library**: Maintain standard rates for common work items
- **Abstract View**: Professional estimate summary with totals
- **Export**: Generate PDF and Excel reports

### Technical Features
- Next.js 15 with App Router
- MongoDB with Prisma ORM
- Tailwind CSS v4 with shadcn/ui components
- Automatic calculations (Quantity = Length × Width × Height)
- Real-time amount updates
- Indian currency formatting (₹)
- Responsive design

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`
   DATABASE_URL="your-mongodb-connection-string"
   \`\`\`

4. Generate Prisma client:
   \`\`\`bash
   npx prisma generate
   \`\`\`

5. Seed the database with default units:
   \`\`\`bash
   npx tsx scripts/seed-units.ts
   \`\`\`

6. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Usage

### Creating an Estimate
1. Click "New Estimate" on the dashboard
2. Fill in estimate details (title, category, location, description)
3. Add work items with dimensions and rates
4. View abstract and export as PDF/Excel

### Managing Units
1. Navigate to "Unit Master" from the dashboard
2. Add custom measurement units as needed
3. Units are used across all estimates

### Rate Library
1. Navigate to "Rate Library" from the dashboard
2. Add standard rates for common work items
3. Select from library when adding work items for quick entry

## Database Schema

- **Estimate**: Project details and metadata
- **WorkItem**: Individual work items with calculations
- **UnitMaster**: Measurement units
- **RateLibrary**: Standard rates for work items

## Export Formats

- **PDF**: Professional abstract with formatted tables
- **Excel**: Two sheets - Abstract and Detailed (with dimensions)

## Categories

- Building
- Road
- Drain
- Culvert
- Electrical
- Water Supply
- Irrigation
- Miscellaneous
