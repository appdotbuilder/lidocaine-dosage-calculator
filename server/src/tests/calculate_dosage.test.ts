
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, anestheticsTable, dosageCalculationsTable } from '../db/schema';
import { type CalculateDosageInput } from '../schema';
import { calculateDosage } from '../handlers/calculate_dosage';
import { eq } from 'drizzle-orm';

describe('calculateDosage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate dosage correctly', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        weight_kg: '70.5',
        age_years: 30
      })
      .returning()
      .execute();

    // Create test anesthetic
    const anestheticResult = await db.insert(anestheticsTable)
      .values({
        name: 'Lidocaine',
        max_dose_mg_per_kg: '7.0',
        common_concentrations: [10, 20, 40] // mg/mL
      })
      .returning()
      .execute();

    const testInput: CalculateDosageInput = {
      patient_id: patientResult[0].id,
      anesthetic_id: anestheticResult[0].id,
      concentration_mg_per_ml: 20
    };

    const result = await calculateDosage(testInput);

    // Verify calculations
    expect(result.patient_name).toEqual('Test Patient');
    expect(result.patient_weight_kg).toEqual(70.5);
    expect(result.anesthetic_name).toEqual('Lidocaine');
    expect(result.concentration_mg_per_ml).toEqual(20);
    
    // Max safe dose = 70.5 kg * 7.0 mg/kg = 493.5 mg
    expect(result.max_safe_dose_mg).toEqual(493.5);
    
    // Max safe volume = 493.5 mg / 20 mg/mL = 24.675 mL
    expect(result.max_safe_volume_ml).toEqual(24.675);
    
    expect(result.calculation_id).toBeDefined();
    expect(result.calculated_at).toBeInstanceOf(Date);
  });

  it('should save calculation to database', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        weight_kg: '50.0',
        age_years: 25
      })
      .returning()
      .execute();

    // Create test anesthetic
    const anestheticResult = await db.insert(anestheticsTable)
      .values({
        name: 'Bupivacaine',
        max_dose_mg_per_kg: '2.5',
        common_concentrations: [2.5, 5.0]
      })
      .returning()
      .execute();

    const testInput: CalculateDosageInput = {
      patient_id: patientResult[0].id,
      anesthetic_id: anestheticResult[0].id,
      concentration_mg_per_ml: 5.0
    };

    const result = await calculateDosage(testInput);

    // Verify record was saved to database
    const savedCalculations = await db.select()
      .from(dosageCalculationsTable)
      .where(eq(dosageCalculationsTable.id, result.calculation_id))
      .execute();

    expect(savedCalculations).toHaveLength(1);
    const savedCalculation = savedCalculations[0];
    
    expect(savedCalculation.patient_id).toEqual(patientResult[0].id);
    expect(savedCalculation.anesthetic_id).toEqual(anestheticResult[0].id);
    expect(parseFloat(savedCalculation.concentration_mg_per_ml)).toEqual(5.0);
    expect(parseFloat(savedCalculation.max_safe_dose_mg)).toEqual(125.0); // 50 * 2.5
    expect(parseFloat(savedCalculation.max_safe_volume_ml)).toEqual(25.0); // 125 / 5
    expect(savedCalculation.calculated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal calculations accurately', async () => {
    // Create test patient with decimal weight
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Small Patient',
        weight_kg: '12.75',
        age_years: 5
      })
      .returning()
      .execute();

    // Create test anesthetic with decimal dose
    const anestheticResult = await db.insert(anestheticsTable)
      .values({
        name: 'Articaine',
        max_dose_mg_per_kg: '4.4',
        common_concentrations: [40]
      })
      .returning()
      .execute();

    const testInput: CalculateDosageInput = {
      patient_id: patientResult[0].id,
      anesthetic_id: anestheticResult[0].id,
      concentration_mg_per_ml: 40
    };

    const result = await calculateDosage(testInput);

    // Max safe dose = 12.75 kg * 4.4 mg/kg = 56.1 mg
    expect(result.max_safe_dose_mg).toEqual(56.1);
    
    // Max safe volume = 56.1 mg / 40 mg/mL = 1.4025 mL
    expect(result.max_safe_volume_ml).toEqual(1.4025);
  });

  it('should throw error for non-existent patient', async () => {
    // Create test anesthetic
    const anestheticResult = await db.insert(anestheticsTable)
      .values({
        name: 'Lidocaine',
        max_dose_mg_per_kg: '7.0',
        common_concentrations: [10, 20]
      })
      .returning()
      .execute();

    const testInput: CalculateDosageInput = {
      patient_id: 99999, // Non-existent patient ID
      anesthetic_id: anestheticResult[0].id,
      concentration_mg_per_ml: 20
    };

    await expect(calculateDosage(testInput)).rejects.toThrow(/patient.*not found/i);
  });

  it('should throw error for non-existent anesthetic', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        weight_kg: '70.0'
      })
      .returning()
      .execute();

    const testInput: CalculateDosageInput = {
      patient_id: patientResult[0].id,
      anesthetic_id: 99999, // Non-existent anesthetic ID
      concentration_mg_per_ml: 20
    };

    await expect(calculateDosage(testInput)).rejects.toThrow(/anesthetic.*not found/i);
  });
});
