
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createPatientInputSchema, 
  createAnestheticInputSchema, 
  calculateDosageInputSchema 
} from './schema';
import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { createAnesthetic } from './handlers/create_anesthetic';
import { getAnesthetics } from './handlers/get_anesthetics';
import { calculateDosage } from './handlers/calculate_dosage';
import { getDosageHistory } from './handlers/get_dosage_history';
import { seedDefaultAnesthetics } from './handlers/seed_default_anesthetics';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Patient management
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  getPatients: publicProcedure
    .query(() => getPatients()),
  
  // Anesthetic management
  createAnesthetic: publicProcedure
    .input(createAnestheticInputSchema)
    .mutation(({ input }) => createAnesthetic(input)),
  getAnesthetics: publicProcedure
    .query(() => getAnesthetics()),
  seedDefaultAnesthetics: publicProcedure
    .mutation(() => seedDefaultAnesthetics()),
  
  // Dosage calculations
  calculateDosage: publicProcedure
    .input(calculateDosageInputSchema)
    .mutation(({ input }) => calculateDosage(input)),
  getDosageHistory: publicProcedure
    .input(z.object({ patientId: z.number().optional() }))
    .query(({ input }) => getDosageHistory(input.patientId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
