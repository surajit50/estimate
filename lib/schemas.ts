import { z } from "zod"
import { ESTIMATE_CATEGORIES } from "@/lib/types"

export const nonEmptyString = z.string().min(1, "Required")

export const estimateSchema = z.object({
  title: nonEmptyString,
  category: z.enum([...ESTIMATE_CATEGORIES] as [string, ...string[]], {
    required_error: "Select a category",
  }),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  activityCode: z.string().optional().default(""),
})

export type EstimateFormValues = z.infer<typeof estimateSchema>

export const unitSchema = z.object({
  unitName: nonEmptyString,
  unitSymbol: nonEmptyString,
})

export type UnitFormValues = z.infer<typeof unitSchema>

export const rateSchema = z.object({
  description: nonEmptyString,
  unitId: nonEmptyString,
  standardRate: z.coerce.number().positive("Must be > 0"),
  year: z.string().optional().default(""),
})

export type RateFormValues = z.infer<typeof rateSchema>

export const simpleWorkItemSchema = z.object({
  pageRef: z.string().optional().default(""),
  description: nonEmptyString,
  unitId: nonEmptyString,
  rate: z.coerce.number().positive("Must be > 0"),
  quantity: z.coerce.number().positive("Must be > 0"),
  length: z.coerce.number().optional().default(0),
  width: z.coerce.number().optional().default(0),
  height: z.coerce.number().optional().default(0),
})

export type SimpleWorkItemFormValues = z.infer<typeof simpleWorkItemSchema>

export const workItemSchema = z.object({
  pageRef: z.string().optional().default(""),
  description: nonEmptyString,
  unitId: nonEmptyString,
  rate: z.coerce.number().positive("Must be > 0"),
  quantity: z.coerce.number().positive("Must be > 0"),
  
  // Cost Breakdown
  materialCost: z.coerce.number().min(0, "Must be ≥ 0").default(0),
  laborCost: z.coerce.number().min(0, "Must be ≥ 0").default(0),
  equipmentCost: z.coerce.number().min(0, "Must be ≥ 0").default(0),
  overheadCost: z.coerce.number().min(0, "Must be ≥ 0").default(0),
  
  // Additional Fields
  discount: z.coerce.number().min(0, "Must be ≥ 0").default(0),
  profitMargin: z.coerce.number().min(0, "Must be ≥ 0").max(100, "Must be ≤ 100").default(10),
  notes: z.string().optional().default(""),
  
  // Status and Priority
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  
  subItems: z.array(z.object({
    description: z.string().optional().default(""),
    nos: z.coerce.number().positive("Must be > 0"),
    length: z.coerce.number().positive("Must be > 0"),
    breadth: z.coerce.number().positive("Must be > 0"),
    depth: z.coerce.number().positive("Must be > 0"),
  })).optional().default([]),
  subCategories: z.array(z.object({
    categoryName: z.string().optional().default(""),
    description: z.string().optional().default(""),
    subItems: z.array(z.object({
      description: z.string().optional().default(""),
      nos: z.coerce.number().positive("Must be > 0"),
      length: z.coerce.number().positive("Must be > 0"),
      breadth: z.coerce.number().positive("Must be > 0"),
      depth: z.coerce.number().positive("Must be > 0"),
    })).optional().default([]),
  })).optional().default([]),
})

export type WorkItemFormValues = z.infer<typeof workItemSchema>

