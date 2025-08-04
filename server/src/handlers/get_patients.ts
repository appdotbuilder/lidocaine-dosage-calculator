
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';

export const getPatients = async (): Promise<Patient[]> => {
  try {
    // Fetch all patients from database
    const results = await db.select()
      .from(patientsTable)
      .execute();

    // Convert numeric fields back to numbers and handle null age_years
    return results.map(patient => ({
      ...patient,
      weight_kg: parseFloat(patient.weight_kg), // Convert string back to number
      age_years: patient.age_years ?? undefined // Convert null to undefined for Zod schema
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw error;
  }
};
