
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  recordVisitInputSchema,
  passCreationWebhookSchema,
  passScanWebhookSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUserById } from './handlers/get_user_by_id';
import { getUserByPhone } from './handlers/get_user_by_phone';
import { getUserWithStats } from './handlers/get_user_with_stats';
import { updateUserPassSerial } from './handlers/update_user_pass_serial';
import { recordVisit } from './handlers/record_visit';
import { getUserVisits } from './handlers/get_user_visits';
import { createRewardNotification } from './handlers/create_reward_notification';
import { getUserRewardNotifications } from './handlers/get_user_reward_notifications';
import { claimReward } from './handlers/claim_reward';
import { handlePassCreationWebhook } from './handlers/handle_pass_creation_webhook';
import { handlePassScanWebhook } from './handlers/handle_pass_scan_webhook';
import { triggerPassCreation } from './handlers/trigger_pass_creation';
import { triggerPassUpdate } from './handlers/trigger_pass_update';
import { triggerRewardNotification } from './handlers/trigger_reward_notification';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUserById: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserById(input.userId)),

  getUserByPhone: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .query(({ input }) => getUserByPhone(input.phoneNumber)),

  getUserWithStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserWithStats(input.userId)),

  updateUserPassSerial: publicProcedure
    .input(z.object({ userId: z.number(), passSerialNumber: z.string() }))
    .mutation(({ input }) => updateUserPassSerial(input.userId, input.passSerialNumber)),

  // Visit tracking
  recordVisit: publicProcedure
    .input(recordVisitInputSchema)
    .mutation(({ input }) => recordVisit(input)),

  getUserVisits: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserVisits(input.userId)),

  // Reward system
  createRewardNotification: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(({ input }) => createRewardNotification(input.userId)),

  getUserRewardNotifications: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserRewardNotifications(input.userId)),

  claimReward: publicProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(({ input }) => claimReward(input.notificationId)),

  // Webhook handlers
  handlePassCreationWebhook: publicProcedure
    .input(passCreationWebhookSchema)
    .mutation(({ input }) => handlePassCreationWebhook(input)),

  handlePassScanWebhook: publicProcedure
    .input(passScanWebhookSchema)
    .mutation(({ input }) => handlePassScanWebhook(input)),

  // External API integrations
  triggerPassCreation: publicProcedure
    .input(z.object({
      userId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string()
    }))
    .mutation(({ input }) => triggerPassCreation(input)),

  triggerPassUpdate: publicProcedure
    .input(z.object({
      passSerialNumber: z.string(),
      rewardPoints: z.number(),
      totalVisits: z.number()
    }))
    .mutation(({ input }) => triggerPassUpdate(input)),

  triggerRewardNotification: publicProcedure
    .input(z.object({
      userId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string(),
      totalVisits: z.number()
    }))
    .mutation(({ input }) => triggerRewardNotification(input)),
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
