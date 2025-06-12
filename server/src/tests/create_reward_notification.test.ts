
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rewardNotificationsTable } from '../db/schema';
import { createRewardNotification } from '../handlers/create_reward_notification';
import { eq } from 'drizzle-orm';

describe('createRewardNotification', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a reward notification', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        total_visits: 5, // User has reached 5 visits
        current_reward_points: 5
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await createRewardNotification(user.id);

    // Verify notification properties
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(user.id);
    expect(result.notification_sent_at).toBeInstanceOf(Date);
    expect(result.reward_claimed).toBe(false);
    expect(result.reward_claimed_at).toBeNull();
  });

  it('should save reward notification to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '+1987654321',
        total_visits: 5,
        current_reward_points: 5
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await createRewardNotification(user.id);

    // Verify it was saved to database
    const notifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toEqual(user.id);
    expect(notifications[0].reward_claimed).toBe(false);
    expect(notifications[0].notification_sent_at).toBeInstanceOf(Date);
  });

  it('should create multiple notifications for same user', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Wilson',
        phone_number: '+1555666777',
        total_visits: 10, // User has reached multiple reward cycles
        current_reward_points: 0 // Reset after previous reward
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create first notification (after 5 visits)
    const firstNotification = await createRewardNotification(user.id);

    // Create second notification (after 10 visits)
    const secondNotification = await createRewardNotification(user.id);

    // Verify both notifications exist
    expect(firstNotification.id).not.toEqual(secondNotification.id);
    expect(firstNotification.user_id).toEqual(user.id);
    expect(secondNotification.user_id).toEqual(user.id);

    // Verify both are in database
    const notifications = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.user_id, user.id))
      .execute();

    expect(notifications).toHaveLength(2);
  });

  it('should handle foreign key constraint for non-existent user', async () => {
    const nonExistentUserId = 999999;

    await expect(createRewardNotification(nonExistentUserId))
      .rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should set default values correctly', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Alice',
        last_name: 'Brown',
        phone_number: '+1444333222',
        total_visits: 5,
        current_reward_points: 5
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await createRewardNotification(user.id);

    // Verify default values are set correctly
    expect(result.reward_claimed).toBe(false);
    expect(result.reward_claimed_at).toBeNull();
    expect(result.notification_sent_at).toBeInstanceOf(Date);
    
    // Verify notification was created recently (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(result.notification_sent_at >= oneMinuteAgo).toBe(true);
    expect(result.notification_sent_at <= now).toBe(true);
  });
});
