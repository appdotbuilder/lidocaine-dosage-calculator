
import { serial, text, pgTable, timestamp, numeric, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  weight_kg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
  age_years: integer('age_years'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const anestheticsTable = pgTable('anesthetics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  max_dose_mg_per_kg: numeric('max_dose_mg_per_kg', { precision: 5, scale: 2 }).notNull(),
  common_concentrations: jsonb('common_concentrations').notNull(), // Array of concentrations in mg/mL
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const dosageCalculationsTable = pgTable('dosage_calculations', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull(),
  anesthetic_id: integer('anesthetic_id').notNull(),
  concentration_mg_per_ml: numeric('concentration_mg_per_ml', { precision: 5, scale: 2 }).notNull(),
  max_safe_dose_mg: numeric('max_safe_dose_mg', { precision: 8, scale: 2 }).notNull(),
  max_safe_volume_ml: numeric('max_safe_volume_ml', { precision: 8, scale: 2 }).notNull(),
  calculated_at: timestamp('calculated_at').defaultNow().notNull(),
});

// Relations
export const patientsRelations = relations(patientsTable, ({ many }) => ({
  dosageCalculations: many(dosageCalculationsTable),
}));

export const anestheticsRelations = relations(anestheticsTable, ({ many }) => ({
  dosageCalculations: many(dosageCalculationsTable),
}));

export const dosageCalculationsRelations = relations(dosageCalculationsTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [dosageCalculationsTable.patient_id],
    references: [patientsTable.id],
  }),
  anesthetic: one(anestheticsTable, {
    fields: [dosageCalculationsTable.anesthetic_id],
    references: [anestheticsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  patients: patientsTable,
  anesthetics: anestheticsTable,
  dosageCalculations: dosageCalculationsTable,
};
