
import { db } from '../db';
import { dosageCalculationsTable } from '../db/schema';
import { type DosageCalculation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getDosageHistory = async (patientId?: number): Promise<DosageCalculation[]> => {
  try {
    let results;

    if (patientId !== undefined) {
      // Query with patient filter
      results = await db.select()
        .from(dosageCalculationsTable)
        .where(eq(dosageCalculationsTable.patient_id, patientId))
        .orderBy(desc(dosageCalculationsTable.calculated_at))
        .execute();
    } else {
      // Query without filter
      results = await db.select()
        .from(dosageCalculationsTable)
        .orderBy(desc(dosageCalculationsTable.calculated_at))
        .execute();
    }

    // Convert numeric fields back to numbers
    return results.map(calculation => ({
      ...calculation,
      concentration_mg_per_ml: parseFloat(calculation.concentration_mg_per_ml),
      max_safe_dose_mg: parseFloat(calculation.max_safe_dose_mg),
      max_safe_volume_ml: parseFloat(calculation.max_safe_volume_ml)
    }));
  } catch (error) {
    console.error('Dosage history retrieval failed:', error);
    throw error;
  }
};
