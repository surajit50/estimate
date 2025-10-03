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
  cgstPercent: z.coerce.number().nonnegative("Must be ≥ 0"),
  sgstPercent: z.coerce.number().nonnegative("Must be ≥ 0"),
  cessPercent: z.coerce.number().nonnegative("Must be ≥ 0"),
  contingency: z.coerce.number().min(0, "Must be ≥ 0"),
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

export const subItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().optional().default(""),
  nos: z.coerce.number().min(0, "Must be ≥ 0"),
  length: z.coerce.number().min(0, "Must be ≥ 0"),
  breadth: z.coerce.number().min(0, "Must be ≥ 0"),
  depth: z.coerce.number().min(0, "Must be ≥ 0"),
})

export const workItemSchema = z.object({
  pageRef: z.string().optional().default(""),
  description: nonEmptyString,
  unitId: nonEmptyString,
  rate: z.coerce.number().min(0, "Must be ≥ 0"),
  length: z.coerce.number().min(0, "Must be ≥ 0"),
  width: z.coerce.number().min(0, "Must be ≥ 0"),
  height: z.coerce.number().min(0, "Must be ≥ 0"),
  subItems: z.array(subItemSchema).optional().default([]),
})

export type WorkItemFormValues = z.infer<typeof workItemSchema>

