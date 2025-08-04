
import { db } from '../db';
import { anestheticsTable } from '../db/schema';
import { type CreateAnestheticInput, type Anesthetic } from '../schema';

export const createAnesthetic = async (input: CreateAnestheticInput): Promise<Anesthetic> => {
  try {
    // Insert anesthetic record
    const result = await db.insert(anestheticsTable)
      .values({
        name: input.name,
        max_dose_mg_per_kg: input.max_dose_mg_per_kg.toString(), // Convert number to string for numeric column
        common_concentrations: input.common_concentrations // JSONB column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const anesthetic = result[0];
    return {
      ...anesthetic,
      max_dose_mg_per_kg: parseFloat(anesthetic.max_dose_mg_per_kg), // Convert string back to number
      common_concentrations: anesthetic.common_concentrations as number[] // Type assertion for JSONB
    };
  } catch (error) {
    console.error('Anesthetic creation failed:', error);
    throw error;
  }
};
