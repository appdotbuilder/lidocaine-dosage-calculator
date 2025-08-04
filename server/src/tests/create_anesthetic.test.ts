
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { anestheticsTable } from '../db/schema';
import { type CreateAnestheticInput } from '../schema';
import { createAnesthetic } from '../handlers/create_anesthetic';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateAnestheticInput = {
  name: 'Lidocaine',
  max_dose_mg_per_kg: 4.5,
  common_concentrations: [10, 20, 40] // mg/mL concentrations
};

describe('createAnesthetic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an anesthetic', async () => {
    const result = await createAnesthetic(testInput);

    // Basic field validation
    expect(result.name).toEqual('Lidocaine');
    expect(result.max_dose_mg_per_kg).toEqual(4.5);
    expect(typeof result.max_dose_mg_per_kg).toEqual('number');
    expect(result.common_concentrations).toEqual([10, 20, 40]);
    expect(Array.isArray(result.common_concentrations)).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save anesthetic to database', async () => {
    const result = await createAnesthetic(testInput);

    // Query using proper drizzle syntax
    const anesthetics = await db.select()
      .from(anestheticsTable)
      .where(eq(anestheticsTable.id, result.id))
      .execute();

    expect(anesthetics).toHaveLength(1);
    expect(anesthetics[0].name).toEqual('Lidocaine');
    expect(parseFloat(anesthetics[0].max_dose_mg_per_kg)).toEqual(4.5);
    expect(anesthetics[0].common_concentrations).toEqual([10, 20, 40]);
    expect(anesthetics[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different concentration arrays', async () => {
    const inputWithSingleConcentration: CreateAnestheticInput = {
      name: 'Bupivacaine',
      max_dose_mg_per_kg: 2.0,
      common_concentrations: [5] // Single concentration
    };

    const result = await createAnesthetic(inputWithSingleConcentration);

    expect(result.name).toEqual('Bupivacaine');
    expect(result.max_dose_mg_per_kg).toEqual(2.0);
    expect(result.common_concentrations).toEqual([5]);
    expect(result.common_concentrations).toHaveLength(1);

    // Verify in database
    const anesthetics = await db.select()
      .from(anestheticsTable)
      .where(eq(anestheticsTable.id, result.id))
      .execute();

    expect(anesthetics[0].common_concentrations).toEqual([5]);
  });

  it('should preserve precision in numeric values', async () => {
    const precisionInput: CreateAnestheticInput = {
      name: 'Articaine',
      max_dose_mg_per_kg: 7.25, // Test decimal precision
      common_concentrations: [25.5, 40.75] // Test decimal concentrations
    };

    const result = await createAnesthetic(precisionInput);

    expect(result.max_dose_mg_per_kg).toEqual(7.25);
    expect(result.common_concentrations).toEqual([25.5, 40.75]);
    expect(typeof result.max_dose_mg_per_kg).toEqual('number');
  });
});
