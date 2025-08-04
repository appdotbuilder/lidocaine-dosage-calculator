
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';

export const createPatient = async (input: CreatePatientInput): Promise<Patient> => {
  try {
    // Insert patient record
    const result = await db.insert(patientsTable)
      .values({
        name: input.name,
        weight_kg: input.weight_kg.toString(), // Convert number to string for numeric column
        age_years: input.age_years // Integer column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const patient = result[0];
    return {
      ...patient,
      weight_kg: parseFloat(patient.weight_kg), // Convert string back to number
      age_years: patient.age_years ?? undefined // Convert null to undefined for schema compatibility
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
