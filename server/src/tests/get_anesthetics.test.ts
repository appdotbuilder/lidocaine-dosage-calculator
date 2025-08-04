
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { anestheticsTable } from '../db/schema';
import { type CreateAnestheticInput } from '../schema';
import { getAnesthetics } from '../handlers/get_anesthetics';

const testAnesthetic1: CreateAnestheticInput = {
  name: 'Lidocaine',
  max_dose_mg_per_kg: 4.5,
  common_concentrations: [10, 20]
};

const testAnesthetic2: CreateAnestheticInput = {
  name: 'Bupivacaine',
  max_dose_mg_per_kg: 2.0,
  common_concentrations: [2.5, 5.0, 7.5]
};

describe('getAnesthetics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no anesthetics exist', async () => {
    const result = await getAnesthetics();
    
    expect(result).toEqual([]);
  });

  it('should return all anesthetics with correct data types', async () => {
    // Create test anesthetics
    await db.insert(anestheticsTable)
      .values([
        {
          name: testAnesthetic1.name,
          max_dose_mg_per_kg: testAnesthetic1.max_dose_mg_per_kg.toString(),
          common_concentrations: testAnesthetic1.common_concentrations
        },
        {
          name: testAnesthetic2.name,
          max_dose_mg_per_kg: testAnesthetic2.max_dose_mg_per_kg.toString(),
          common_concentrations: testAnesthetic2.common_concentrations
        }
      ])
      .execute();

    const result = await getAnesthetics();

    expect(result).toHaveLength(2);
    
    // Check first anesthetic
    const lidocaine = result.find(a => a.name === 'Lidocaine');
    expect(lidocaine).toBeDefined();
    expect(lidocaine!.name).toEqual('Lidocaine');
    expect(lidocaine!.max_dose_mg_per_kg).toEqual(4.5);
    expect(typeof lidocaine!.max_dose_mg_per_kg).toBe('number');
    expect(lidocaine!.common_concentrations).toEqual([10, 20]);
    expect(Array.isArray(lidocaine!.common_concentrations)).toBe(true);
    expect(lidocaine!.id).toBeDefined();
    expect(lidocaine!.created_at).toBeInstanceOf(Date);

    // Check second anesthetic
    const bupivacaine = result.find(a => a.name === 'Bupivacaine');
    expect(bupivacaine).toBeDefined();
    expect(bupivacaine!.name).toEqual('Bupivacaine');
    expect(bupivacaine!.max_dose_mg_per_kg).toEqual(2.0);
    expect(typeof bupivacaine!.max_dose_mg_per_kg).toBe('number');
    expect(bupivacaine!.common_concentrations).toEqual([2.5, 5.0, 7.5]);
    expect(Array.isArray(bupivacaine!.common_concentrations)).toBe(true);
  });

  it('should handle anesthetics with single concentration', async () => {
    const singleConcentrationAnesthetic = {
      name: 'Test Anesthetic',
      max_dose_mg_per_kg: '3.0',
      common_concentrations: [15.0]
    };

    await db.insert(anestheticsTable)
      .values(singleConcentrationAnesthetic)
      .execute();

    const result = await getAnesthetics();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Anesthetic');
    expect(result[0].max_dose_mg_per_kg).toEqual(3.0);
    expect(result[0].common_concentrations).toEqual([15.0]);
    expect(result[0].common_concentrations).toHaveLength(1);
  });
});
