
import { db } from '../db';
import { anestheticsTable } from '../db/schema';
import { type Anesthetic } from '../schema';

export const getAnesthetics = async (): Promise<Anesthetic[]> => {
  try {
    const result = await db.select()
      .from(anestheticsTable)
      .execute();

    // Convert numeric fields back to numbers and handle jsonb arrays
    return result.map(anesthetic => ({
      ...anesthetic,
      max_dose_mg_per_kg: parseFloat(anesthetic.max_dose_mg_per_kg),
      common_concentrations: anesthetic.common_concentrations as number[]
    }));
  } catch (error) {
    console.error('Failed to fetch anesthetics:', error);
    throw error;
  }
};
