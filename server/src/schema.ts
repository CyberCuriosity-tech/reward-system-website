
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  total_visits: z.number().int(),
  current_reward_points: z.number().int(),
  pass_serial_number: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user registration
export const createUserInputSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Visit schema
export const visitSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  pass_serial_number: z.string(),
  visited_at: z.coerce.date(),
  reward_points_earned: z.number().int(),
  is_reward_visit: z.boolean()
});

export type Visit = z.infer<typeof visitSchema>;

// Input schema for recording visits
export const recordVisitInputSchema = z.object({
  pass_serial_number: z.string().min(1, "Pass serial number is required")
});

export type RecordVisitInput = z.infer<typeof recordVisitInputSchema>;

// Reward notification schema
export const rewardNotificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  notification_sent_at: z.coerce.date(),
  reward_claimed: z.boolean(),
  reward_claimed_at: z.coerce.date().nullable()
});

export type RewardNotification = z.infer<typeof rewardNotificationSchema>;

// Pass creation webhook payload schema
export const passCreationWebhookSchema = z.object({
  user_id: z.number(),
  pass_serial_number: z.string(),
  pass_url: z.string(),
  pass_type: z.enum(['apple', 'google'])
});

export type PassCreationWebhookPayload = z.infer<typeof passCreationWebhookSchema>;

// Pass scan webhook payload schema
export const passScanWebhookSchema = z.object({
  pass_serial_number: z.string(),
  scanned_at: z.string(),
  location: z.string().optional()
});

export type PassScanWebhookPayload = z.infer<typeof passScanWebhookSchema>;

// User with visit statistics
export const userWithStatsSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  total_visits: z.number().int(),
  current_reward_points: z.number().int(),
  pass_serial_number: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  is_eligible_for_reward: z.boolean(),
  visits_until_reward: z.number().int()
});

export type UserWithStats = z.infer<typeof userWithStatsSchema>;

// Device detection schema
export const deviceTypeSchema = z.enum(['ios', 'android', 'desktop']);
export type DeviceType = z.infer<typeof deviceTypeSchema>;
