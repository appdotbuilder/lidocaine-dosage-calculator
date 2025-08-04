
import { db } from '../db';
import { patientsTable, anestheticsTable, dosageCalculationsTable } from '../db/schema';
import { type CalculateDosageInput, type DosageCalculationResult } from '../schema';
import { eq } from 'drizzle-orm';

export async function calculateDosage(input: CalculateDosageInput): Promise<DosageCalculationResult> {
  try {
    // Fetch patient data
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.patient_id))
      .execute();

    if (patients.length === 0) {
      throw new Error(`Patient with ID ${input.patient_id} not found`);
    }

    // Fetch anesthetic data
    const anesthetics = await db.select()
      .from(anestheticsTable)
      .where(eq(anestheticsTable.id, input.anesthetic_id))
      .execute();

    if (anesthetics.length === 0) {
      throw new Error(`Anesthetic with ID ${input.anesthetic_id} not found`);
    }

    const patient = patients[0];
    const anesthetic = anesthetics[0];

    // Convert numeric fields from strings to numbers
    const patientWeight = parseFloat(patient.weight_kg);
    const maxDosePerKg = parseFloat(anesthetic.max_dose_mg_per_kg);

    // Calculate maximum safe dose and volume
    const maxSafeDoseMg = patientWeight * maxDosePerKg;
    const maxSafeVolumeMl = maxSafeDoseMg / input.concentration_mg_per_ml;

    // Store the calculation in database
    const calculationResult = await db.insert(dosageCalculationsTable)
      .values({
        patient_id: input.patient_id,
        anesthetic_id: input.anesthetic_id,
        concentration_mg_per_ml: input.concentration_mg_per_ml.toString(),
        max_safe_dose_mg: maxSafeDoseMg.toString(),
        max_safe_volume_ml: maxSafeVolumeMl.toString()
      })
      .returning()
      .execute();

    const calculation = calculationResult[0];

    // Return the complete calculation result
    return {
      patient_name: patient.name,
      patient_weight_kg: patientWeight,
      anesthetic_name: anesthetic.name,
      concentration_mg_per_ml: input.concentration_mg_per_ml,
      max_safe_dose_mg: maxSafeDoseMg,
      max_safe_volume_ml: maxSafeVolumeMl,
      calculation_id: calculation.id,
      calculated_at: calculation.calculated_at
    };
  } catch (error) {
    console.error('Dosage calculation failed:', error);
    throw error;
  }
}
