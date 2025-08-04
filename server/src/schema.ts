
import { z } from 'zod';

// Patient schema
export const patientSchema = z.object({
  id: z.number(),
  name: z.string(),
  weight_kg: z.number().positive(),
  age_years: z.number().int().positive().optional(),
  created_at: z.coerce.date()
});

export type Patient = z.infer<typeof patientSchema>;

// Anesthetic schema
export const anestheticSchema = z.object({
  id: z.number(),
  name: z.string(),
  max_dose_mg_per_kg: z.number().positive(),
  common_concentrations: z.array(z.number().positive()), // mg/mL concentrations
  created_at: z.coerce.date()
});

export type Anesthetic = z.infer<typeof anestheticSchema>;

// Dosage calculation schema
export const dosageCalculationSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  anesthetic_id: z.number(),
  concentration_mg_per_ml: z.number().positive(),
  max_safe_dose_mg: z.number().positive(),
  max_safe_volume_ml: z.number().positive(),
  calculated_at: z.coerce.date()
});

export type DosageCalculation = z.infer<typeof dosageCalculationSchema>;

// Input schemas
export const createPatientInputSchema = z.object({
  name: z.string().min(1),
  weight_kg: z.number().positive().max(200), // Reasonable weight limit
  age_years: z.number().int().positive().max(120).optional()
});

export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

export const createAnestheticInputSchema = z.object({
  name: z.string().min(1),
  max_dose_mg_per_kg: z.number().positive(),
  common_concentrations: z.array(z.number().positive()).min(1)
});

export type CreateAnestheticInput = z.infer<typeof createAnestheticInputSchema>;

export const calculateDosageInputSchema = z.object({
  patient_id: z.number().positive(),
  anesthetic_id: z.number().positive(),
  concentration_mg_per_ml: z.number().positive()
});

export type CalculateDosageInput = z.infer<typeof calculateDosageInputSchema>;

// Output schema for dosage calculation result
export const dosageCalculationResultSchema = z.object({
  patient_name: z.string(),
  patient_weight_kg: z.number(),
  anesthetic_name: z.string(),
  concentration_mg_per_ml: z.number(),
  max_safe_dose_mg: z.number(),
  max_safe_volume_ml: z.number(),
  calculation_id: z.number(),
  calculated_at: z.coerce.date()
});

export type DosageCalculationResult = z.infer<typeof dosageCalculationResultSchema>;
