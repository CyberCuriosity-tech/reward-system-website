
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rewardNotificationsTable } from '../db/schema';
import { triggerRewardNotification, type RewardNotificationRequest } from '../handlers/trigger_reward_notification';
import { eq } from 'drizzle-orm';

describe('triggerRewardNotification', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create reward notification record', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        total_visits: 5,
        current_reward_points: 5
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const request: RewardNotificationRequest = {
      userId,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      totalVisits: 5
    };

    const result = await triggerRewardNotification(request);

    // Verify response
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Reward notification sent successfully for user ${userId}`);

    // Verify notification record was created
    const notifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.user_id, userId))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toBe(userId);
    expect(notifications[0].reward_claimed).toBe(false);
    expect(notifications[0].reward_claimed_at).toBeNull();
    expect(notifications[0].notification_sent_at).toBeInstanceOf(Date);
  });

  it('should handle multiple notifications for same user', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '+1987654321',
        total_visits: 10,
        current_reward_points: 0
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const request: RewardNotificationRequest = {
      userId,
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+1987654321',
      totalVisits: 10
    };

    // Trigger first notification
    await triggerRewardNotification(request);

    // Trigger second notification (e.g., after another 5 visits)
    const secondRequest = { ...request, totalVisits: 15 };
    await triggerRewardNotification(secondRequest);

    // Verify both notifications were created
    const notifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.user_id, userId))
      .execute();

    expect(notifications).toHaveLength(2);
    notifications.forEach(notification => {
      expect(notification.user_id).toBe(userId);
      expect(notification.reward_claimed).toBe(false);
      expect(notification.reward_claimed_at).toBeNull();
      expect(notification.notification_sent_at).toBeInstanceOf(Date);
    });
  });

  it('should handle reward notification for user with long name', async () => {
    // Create test user with longer names
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Christopher',
        last_name: 'Montgomery-Williams',
        phone_number: '+44123456789',
        total_visits: 5,
        current_reward_points: 5
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const request: RewardNotificationRequest = {
      userId,
      firstName: 'Christopher',
      lastName: 'Montgomery-Williams',
      phoneNumber: '+44123456789',
      totalVisits: 5
    };

    const result = await triggerRewardNotification(request);

    // Verify response
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Reward notification sent successfully for user ${userId}`);

    // Verify notification record was created
    const notifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.user_id, userId))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toBe(userId);
  });

  it('should handle different visit counts correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        phone_number: '+1555000000',
        total_visits: 25,
        current_reward_points: 0
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Test with different visit counts (multiples of 5 for new 5-visit reward cycle)
    const visitCounts = [5, 10, 15, 20, 25];

    for (const visitCount of visitCounts) {
      const request: RewardNotificationRequest = {
        userId,
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1555000000',
        totalVisits: visitCount
      };

      const result = await triggerRewardNotification(request);
      expect(result.success).toBe(true);
    }

    // Verify all notifications were created
    const notifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.user_id, userId))
      .execute();

    expect(notifications).toHaveLength(visitCounts.length);
  });

  it('should throw error if user does not exist', async () => {
    const request: RewardNotificationRequest = {
      userId: 999999, // Non-existent user ID
      firstName: 'Non',
      lastName: 'Existent',
      phoneNumber: '+1000000000',
      totalVisits: 5
    };

    // Should throw error due to foreign key constraint
    await expect(triggerRewardNotification(request)).rejects.toThrow();
  });
});
