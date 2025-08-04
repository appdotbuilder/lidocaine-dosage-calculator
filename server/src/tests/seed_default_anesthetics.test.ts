
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { anestheticsTable } from '../db/schema';
import { seedDefaultAnesthetics } from '../handlers/seed_default_anesthetics';
import { eq } from 'drizzle-orm';

describe('seedDefaultAnesthetics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should seed default anesthetics when database is empty', async () => {
    const results = await seedDefaultAnesthetics();

    // Should return multiple anesthetics
    expect(results.length).toBeGreaterThan(0);
    
    // Check that Lidocaine is included
    const lidocaine = results.find(a => a.name === 'Lidocaine');
    expect(lidocaine).toBeDefined();
    expect(lidocaine?.max_dose_mg_per_kg).toBe(4.5);
    expect(lidocaine?.common_concentrations).toEqual([10, 20]);
    expect(typeof lidocaine?.max_dose_mg_per_kg).toBe('number');
    expect(Array.isArray(lidocaine?.common_concentrations)).toBe(true);
    expect(lidocaine?.id).toBeDefined();
    expect(lidocaine?.created_at).toBeInstanceOf(Date);
  });

  it('should save anesthetics to database', async () => {
    await seedDefaultAnesthetics();

    // Query database directly
    const anesthetics = await db.select()
      .from(anestheticsTable)
      .execute();

    expect(anesthetics.length).toBeGreaterThan(0);
    
    // Verify Lidocaine exists in database
    const lidocaine = anesthetics.find(a => a.name === 'Lidocaine');
    expect(lidocaine).toBeDefined();
    expect(parseFloat(lidocaine!.max_dose_mg_per_kg)).toBe(4.5);
    expect(lidocaine!.common_concentrations).toEqual([10, 20]);
  });

  it('should return existing anesthetics if already seeded', async () => {
    // First seeding
    const firstResults = await seedDefaultAnesthetics();
    const firstCount = firstResults.length;

    // Second seeding
    const secondResults = await seedDefaultAnesthetics();
    
    // Should return same results without duplicating
    expect(secondResults.length).toBe(firstCount);
    
    // Verify no duplicates were created in database
    const allAnesthetics = await db.select()
      .from(anestheticsTable)
      .execute();
    
    expect(allAnesthetics.length).toBe(firstCount);
  });

  it('should include common anesthetics for circumcision procedures', async () => {
    const results = await seedDefaultAnesthetics();
    
    const anestheticNames = results.map(a => a.name);
    
    // Should include key anesthetics
    expect(anestheticNames).toContain('Lidocaine');
    expect(anestheticNames).toContain('Bupivacaine');
    
    // Verify Bupivacaine properties
    const bupivacaine = results.find(a => a.name === 'Bupivacaine');
    expect(bupivacaine?.max_dose_mg_per_kg).toBe(2.0);
    expect(bupivacaine?.common_concentrations).toEqual([2.5, 5.0]);
  });

  it('should handle proper data types for all fields', async () => {
    const results = await seedDefaultAnesthetics();
    
    results.forEach(anesthetic => {
      expect(typeof anesthetic.id).toBe('number');
      expect(typeof anesthetic.name).toBe('string');
      expect(typeof anesthetic.max_dose_mg_per_kg).toBe('number');
      expect(Array.isArray(anesthetic.common_concentrations)).toBe(true);
      expect(anesthetic.created_at).toBeInstanceOf(Date);
      
      // Verify all concentrations are numbers
      anesthetic.common_concentrations.forEach(concentration => {
        expect(typeof concentration).toBe('number');
        expect(concentration).toBeGreaterThan(0);
      });
    });
  });
});
