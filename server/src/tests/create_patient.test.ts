
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePatientInput = {
  name: 'Test Patient',
  weight_kg: 65.5,
  age_years: 35
};

// Test input without optional age
const testInputNoAge: CreatePatientInput = {
  name: 'Test Patient No Age',
  weight_kg: 70.0
};

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    const result = await createPatient(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Patient');
    expect(result.weight_kg).toEqual(65.5);
    expect(typeof result.weight_kg).toBe('number');
    expect(result.age_years).toEqual(35);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a patient without age', async () => {
    const result = await createPatient(testInputNoAge);

    // Basic field validation
    expect(result.name).toEqual('Test Patient No Age');
    expect(result.weight_kg).toEqual(70.0);
    expect(typeof result.weight_kg).toBe('number');
    expect(result.age_years).toBeUndefined();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save patient to database', async () => {
    const result = await createPatient(testInput);

    // Query using proper drizzle syntax
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].name).toEqual('Test Patient');
    expect(parseFloat(patients[0].weight_kg)).toEqual(65.5);
    expect(patients[0].age_years).toEqual(35);
    expect(patients[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric weight conversion correctly', async () => {
    const preciseWeightInput: CreatePatientInput = {
      name: 'Precise Weight Patient',
      weight_kg: 72.75,
      age_years: 28
    };

    const result = await createPatient(preciseWeightInput);

    // Verify numeric precision is maintained
    expect(result.weight_kg).toEqual(72.75);
    expect(typeof result.weight_kg).toBe('number');

    // Verify it's stored correctly in database
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(parseFloat(patients[0].weight_kg)).toEqual(72.75);
  });
});
