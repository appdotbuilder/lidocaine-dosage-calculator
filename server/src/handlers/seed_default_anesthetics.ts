
import { db } from '../db';
import { anestheticsTable } from '../db/schema';
import { type Anesthetic } from '../schema';

export async function seedDefaultAnesthetics(): Promise<Anesthetic[]> {
  try {
    // Check if anesthetics already exist to avoid duplicates
    const existingAnesthetics = await db.select()
      .from(anestheticsTable)
      .execute();
    
    if (existingAnesthetics.length > 0) {
      // Return existing anesthetics with proper type conversion
      return existingAnesthetics.map(anesthetic => ({
        ...anesthetic,
        max_dose_mg_per_kg: parseFloat(anesthetic.max_dose_mg_per_kg),
        common_concentrations: anesthetic.common_concentrations as number[]
      }));
    }

    // Default anesthetic data for circumcision procedures
    const defaultAnesthetics = [
      {
        name: 'Lidocaine',
        max_dose_mg_per_kg: 4.5,
        common_concentrations: [10, 20] // mg/mL
      },
      {
        name: 'Lidocaine with Epinephrine',
        max_dose_mg_per_kg: 7.0,
        common_concentrations: [10, 20] // mg/mL
      },
      {
        name: 'Bupivacaine',
        max_dose_mg_per_kg: 2.0,
        common_concentrations: [2.5, 5.0] // mg/mL
      },
      {
        name: 'Procaine',
        max_dose_mg_per_kg: 10.0,
        common_concentrations: [10, 20] // mg/mL
      }
    ];

    // Insert default anesthetics
    const results = await db.insert(anestheticsTable)
      .values(defaultAnesthetics.map(anesthetic => ({
        name: anesthetic.name,
        max_dose_mg_per_kg: anesthetic.max_dose_mg_per_kg.toString(),
        common_concentrations: anesthetic.common_concentrations
      })))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(anesthetic => ({
      ...anesthetic,
      max_dose_mg_per_kg: parseFloat(anesthetic.max_dose_mg_per_kg),
      common_concentrations: anesthetic.common_concentrations as number[]
    }));
  } catch (error) {
    console.error('Seeding default anesthetics failed:', error);
    throw error;
  }
}
