
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rewardNotificationsTable } from '../db/schema';
import { claimReward } from '../handlers/claim_reward';
import { eq } from 'drizzle-orm';

describe('claimReward', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark reward notification as claimed', async () => {
    // Create a test user with 5 visits (new reward threshold)
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        total_visits: 5,
        current_reward_points: 0, // Reset after earning reward
        pass_serial_number: 'PASS123'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create an unclaimed reward notification
    const notificationResult = await db.insert(rewardNotificationsTable)
      .values({
        user_id: userId,
        reward_claimed: false,
        reward_claimed_at: null
      })
      .returning()
      .execute();

    const notificationId = notificationResult[0].id;

    // Claim the reward
    const claimedReward = await claimReward(notificationId);

    // Verify the reward is marked as claimed
    expect(claimedReward.id).toEqual(notificationId);
    expect(claimedReward.user_id).toEqual(userId);
    expect(claimedReward.reward_claimed).toBe(true);
    expect(claimedReward.reward_claimed_at).toBeInstanceOf(Date);
    expect(claimedReward.notification_sent_at).toBeInstanceOf(Date);
  });

  it('should save claimed status to database', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '+1987654321',
        total_visits: 10, // Multiple reward cycles (2 cycles of 5 visits each)
        current_reward_points: 0,
        pass_serial_number: 'PASS456'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create an unclaimed reward notification
    const notificationResult = await db.insert(rewardNotificationsTable)
      .values({
        user_id: userId,
        reward_claimed: false,
        reward_claimed_at: null
      })
      .returning()
      .execute();

    const notificationId = notificationResult[0].id;

    // Claim the reward
    await claimReward(notificationId);

    // Verify the database was updated
    const updatedNotifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.id, notificationId))
      .execute();

    expect(updatedNotifications).toHaveLength(1);
    const notification = updatedNotifications[0];
    expect(notification.reward_claimed).toBe(true);
    expect(notification.reward_claimed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent notification', async () => {
    const nonExistentId = 99999;

    // Attempt to claim non-existent reward
    await expect(claimReward(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should handle already claimed rewards', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Johnson',
        phone_number: '+1555666777',
        total_visits: 5,
        current_reward_points: 0,
        pass_serial_number: 'PASS789'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create an already claimed reward notification
    const claimedAt = new Date();
    const notificationResult = await db.insert(rewardNotificationsTable)
      .values({
        user_id: userId,
        reward_claimed: true,
        reward_claimed_at: claimedAt
      })
      .returning()
      .execute();

    const notificationId = notificationResult[0].id;

    // Claim the already claimed reward (should still work, just update timestamp)
    const result = await claimReward(notificationId);

    expect(result.reward_claimed).toBe(true);
    expect(result.reward_claimed_at).toBeInstanceOf(Date);
    // The timestamp should be updated to a new value
    expect(result.reward_claimed_at?.getTime()).toBeGreaterThan(claimedAt.getTime());
  });
});
