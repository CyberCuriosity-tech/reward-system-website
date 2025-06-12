
import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone_number: text('phone_number').notNull().unique(),
  total_visits: integer('total_visits').notNull().default(0),
  current_reward_points: integer('current_reward_points').notNull().default(0),
  pass_serial_number: text('pass_serial_number'), // Nullable - set after pass creation
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const visitsTable = pgTable('visits', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  pass_serial_number: text('pass_serial_number').notNull(),
  visited_at: timestamp('visited_at').defaultNow().notNull(),
  reward_points_earned: integer('reward_points_earned').notNull().default(1),
  is_reward_visit: boolean('is_reward_visit').notNull().default(false), // True if this visit triggered a reward
});

export const rewardNotificationsTable = pgTable('reward_notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  notification_sent_at: timestamp('notification_sent_at').defaultNow().notNull(),
  reward_claimed: boolean('reward_claimed').notNull().default(false),
  reward_claimed_at: timestamp('reward_claimed_at'), // Nullable - set when reward is claimed
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  visits: many(visitsTable),
  rewardNotifications: many(rewardNotificationsTable),
}));

export const visitsRelations = relations(visitsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [visitsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const rewardNotificationsRelations = relations(rewardNotificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [rewardNotificationsTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Visit = typeof visitsTable.$inferSelect;
export type NewVisit = typeof visitsTable.$inferInsert;
export type RewardNotification = typeof rewardNotificationsTable.$inferSelect;
export type NewRewardNotification = typeof rewardNotificationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  visits: visitsTable, 
  rewardNotifications: rewardNotificationsTable 
};
