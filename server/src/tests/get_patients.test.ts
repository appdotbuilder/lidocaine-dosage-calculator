
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { getPatients } from '../handlers/get_patients';

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();
    expect(result).toEqual([]);
  });

  it('should return all patients with correct field types', async () => {
    // Create test patients with different data types
    await db.insert(patientsTable)
      .values([
        {
          name: 'Patient One',
          weight_kg: '25.50', // Insert as string (numeric column)
          age_years: 5
        },
        {
          name: 'Patient Two',
          weight_kg: '12.75',
          age_years: null // Test optional field
        }
      ])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    
    // First patient
    expect(result[0].name).toEqual('Patient One');
    expect(result[0].weight_kg).toEqual(25.50);
    expect(typeof result[0].weight_kg).toBe('number');
    expect(result[0].age_years).toEqual(5);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Second patient (with null age converted to undefined)
    expect(result[1].name).toEqual('Patient Two');
    expect(result[1].weight_kg).toEqual(12.75);
    expect(typeof result[1].weight_kg).toBe('number');
    expect(result[1].age_years).toBeUndefined();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return patients ordered by id', async () => {
    // Insert multiple patients
    await db.insert(patientsTable)
      .values([
        { name: 'Third Patient', weight_kg: '30.00', age_years: 8 },
        { name: 'First Patient', weight_kg: '20.00', age_years: 3 },
        { name: 'Second Patient', weight_kg: '25.00', age_years: 6 }
      ])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(3);
    // Should be ordered by id (insertion order)
    expect(result[0].name).toEqual('Third Patient');
    expect(result[1].name).toEqual('First Patient');
    expect(result[2].name).toEqual('Second Patient');
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
