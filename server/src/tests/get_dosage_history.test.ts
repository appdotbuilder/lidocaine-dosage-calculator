
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, anestheticsTable, dosageCalculationsTable } from '../db/schema';
import { getDosageHistory } from '../handlers/get_dosage_history';

describe('getDosageHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all dosage calculations when no patient ID is provided', async () => {
    // Create test patients
    const patients = await db.insert(patientsTable)
      .values([
        { name: 'Patient 1', weight_kg: '25.5' },
        { name: 'Patient 2', weight_kg: '30.0' }
      ])
      .returning()
      .execute();

    // Create test anesthetic
    const anesthetics = await db.insert(anestheticsTable)
      .values({
        name: 'Lidocaine',
        max_dose_mg_per_kg: '4.5',
        common_concentrations: [10, 20]
      })
      .returning()
      .execute();

    // Create test dosage calculations
    await db.insert(dosageCalculationsTable)
      .values([
        {
          patient_id: patients[0].id,
          anesthetic_id: anesthetics[0].id,
          concentration_mg_per_ml: '10.0',
          max_safe_dose_mg: '114.75',
          max_safe_volume_ml: '11.48'
        },
        {
          patient_id: patients[1].id,
          anesthetic_id: anesthetics[0].id,
          concentration_mg_per_ml: '20.0',
          max_safe_dose_mg: '135.0',
          max_safe_volume_ml: '6.75'
        }
      ])
      .execute();

    const result = await getDosageHistory();

    expect(result).toHaveLength(2);
    
    // Verify numeric conversions
    expect(typeof result[0].concentration_mg_per_ml).toBe('number');
    expect(typeof result[0].max_safe_dose_mg).toBe('number');
    expect(typeof result[0].max_safe_volume_ml).toBe('number');
    
    // Verify that both records are present (order may vary due to same timestamp)
    const concentrations = result.map(r => r.concentration_mg_per_ml).sort((a, b) => a - b);
    const doses = result.map(r => r.max_safe_dose_mg).sort((a, b) => a - b);
    const volumes = result.map(r => r.max_safe_volume_ml).sort((a, b) => a - b);
    
    expect(concentrations).toEqual([10.0, 20.0]);
    expect(doses).toEqual([114.75, 135.0]);
    expect(volumes).toEqual([6.75, 11.48]);
  });

  it('should filter dosage calculations by patient ID', async () => {
    // Create test patients
    const patients = await db.insert(patientsTable)
      .values([
        { name: 'Patient 1', weight_kg: '25.5' },
        { name: 'Patient 2', weight_kg: '30.0' }
      ])
      .returning()
      .execute();

    // Create test anesthetic
    const anesthetics = await db.insert(anestheticsTable)
      .values({
        name: 'Lidocaine',
        max_dose_mg_per_kg: '4.5',
        common_concentrations: [10, 20]
      })
      .returning()
      .execute();

    // Create test dosage calculations for both patients
    await db.insert(dosageCalculationsTable)
      .values([
        {
          patient_id: patients[0].id,
          anesthetic_id: anesthetics[0].id,
          concentration_mg_per_ml: '10.0',
          max_safe_dose_mg: '114.75',
          max_safe_volume_ml: '11.48'
        },
        {
          patient_id: patients[1].id,
          anesthetic_id: anesthetics[0].id,
          concentration_mg_per_ml: '20.0',
          max_safe_dose_mg: '135.0',
          max_safe_volume_ml: '6.75'
        },
        {
          patient_id: patients[0].id,
          anesthetic_id: anesthetics[0].id,
          concentration_mg_per_ml: '15.0',
          max_safe_dose_mg: '114.75',
          max_safe_volume_ml: '7.65'
        }
      ])
      .execute();

    const result = await getDosageHistory(patients[0].id);

    expect(result).toHaveLength(2);
    result.forEach(calculation => {
      expect(calculation.patient_id).toEqual(patients[0].id);
    });

    // Verify numeric conversions
    expect(typeof result[0].concentration_mg_per_ml).toBe('number');
    expect(typeof result[0].max_safe_dose_mg).toBe('number');
    expect(typeof result[0].max_safe_volume_ml).toBe('number');
    
    // Verify the correct records are returned
    const concentrations = result.map(r => r.concentration_mg_per_ml).sort((a, b) => a - b);
    expect(concentrations).toEqual([10.0, 15.0]);
  });

  it('should return empty array when no calculations exist', async () => {
    const result = await getDosageHistory();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when patient has no calculations', async () => {
    // Create test patient
    const patients = await db.insert(patientsTable)
      .values({ name: 'Patient 1', weight_kg: '25.5' })
      .returning()
      .execute();

    const result = await getDosageHistory(patients[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should order results by calculated_at in descending order', async () => {
    // Create test patient and anesthetic
    const patients = await db.insert(patientsTable)
      .values({ name: 'Patient 1', weight_kg: '25.5' })
      .returning()
      .execute();

    const anesthetics = await db.insert(anestheticsTable)
      .values({
        name: 'Lidocaine',
        max_dose_mg_per_kg: '4.5',
        common_concentrations: [10, 20]
      })
      .returning()
      .execute();

    // Create first calculation
    await db.insert(dosageCalculationsTable)
      .values({
        patient_id: patients[0].id,
        anesthetic_id: anesthetics[0].id,
        concentration_mg_per_ml: '10.0',
        max_safe_dose_mg: '114.75',
        max_safe_volume_ml: '11.48'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second calculation
    await db.insert(dosageCalculationsTable)
      .values({
        patient_id: patients[0].id,
        anesthetic_id: anesthetics[0].id,
        concentration_mg_per_ml: '20.0',
        max_safe_dose_mg: '114.75',
        max_safe_volume_ml: '5.74'
      })
      .execute();

    const result = await getDosageHistory(patients[0].id);

    expect(result).toHaveLength(2);
    // Most recent calculation should be first (descending order)
    expect(result[0].calculated_at.getTime()).toBeGreaterThanOrEqual(
      result[1].calculated_at.getTime()
    );
    
    // Verify the most recent one has the expected concentration
    expect(result[0].concentration_mg_per_ml).toEqual(20.0);
    expect(result[1].concentration_mg_per_ml).toEqual(10.0);
  });
});
