export const ESTIMATE_CATEGORIES = [
  "Building",
  "Road",
  "Drain",
  "Culvert",
  "Electrical",
  "Water Supply",
  "Irrigation",
  "Miscellaneous",
] as const

export type EstimateCategory = (typeof ESTIMATE_CATEGORIES)[number]

export interface EstimateWithItems {
  id: string
  title: string
  category: string
  description: string | null
  location: string | null
  activityCode?: string | null
  parameters?: any
  
  // Client Information
  clientName?: string | null
  clientContact?: string | null
  clientEmail?: string | null
  clientAddress?: string | null
  
  // Project Timeline
  startDate?: Date | null
  endDate?: Date | null
  duration?: number | null
  
  // Budget Tracking
  estimatedBudget?: number
  actualCost?: number
  variance?: number
  
  // Status and Priority
  status?: string
  priority?: string
  
  // Tags
  tags?: string[]
  
  // Tax Configuration
  cgstPercent?: number
  sgstPercent?: number
  cessPercent?: number
  
  // Additional Costs
  contingency?: number
  overhead?: number
  profitMargin?: number
  discount?: number
  
  // Notes and Attachments
  attachments?: string[]
  
  createdAt: Date
  updatedAt: Date
  workItems: WorkItemWithUnit[]
}

export interface WorkItemWithUnit {
  id: string
  itemNo: number
  pageRef?: string | null
  description: string
  unitId: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  rate: number
  length: number
  width: number
  height: number
  quantity: number
  amount: number
  
  // Cost Breakdown
  materialCost?: number
  laborCost?: number
  equipmentCost?: number
  overheadCost?: number
  
  // Additional Fields
  discount?: number
  profitMargin?: number
  notes?: string | null
  
  // Status and Priority
  status?: string
  priority?: string
  
  subItems?: SubWorkItemType[]
  subCategories?: SubCategoryType[]
}

export interface SubCategoryType {
  id: string
  categoryName: string
  description?: string | null
  subItems: SubWorkItemType[]
}

export interface SubWorkItemType {
  id: string
  description: string
  nos: number
  length: number
  breadth: number
  depth: number
  quantity: number
  unitSymbol: string
  subCategoryId?: string | null
}

export interface UnitMasterType {
  id: string
  unitName: string
  unitSymbol: string
  createdAt: Date
}

export interface RateLibraryType {
  id: string
  description: string
  unitId: string
  unit: {
    id: string
    unitName: string
    unitSymbol: string
  }
  standardRate: number
  year: string | null
  createdAt: Date
  updatedAt: Date
}
