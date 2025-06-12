
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rewardNotificationsTable } from '../db/schema';
import { getUserRewardNotifications } from '../handlers/get_user_reward_notifications';

describe('getUserRewardNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no notifications', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const notifications = await getUserRewardNotifications(userId);

    expect(notifications).toEqual([]);
  });

  it('should return notifications for user ordered by notification_sent_at desc', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '+1987654321'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple notifications with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(rewardNotificationsTable)
      .values([
        {
          user_id: userId,
          notification_sent_at: yesterday,
          reward_claimed: false
        },
        {
          user_id: userId,
          notification_sent_at: tomorrow,
          reward_claimed: true,
          reward_claimed_at: tomorrow
        },
        {
          user_id: userId,
          notification_sent_at: now,
          reward_claimed: false
        }
      ])
      .execute();

    const notifications = await getUserRewardNotifications(userId);

    expect(notifications).toHaveLength(3);
    
    // Should be ordered by notification_sent_at descending (newest first)
    expect(notifications[0].notification_sent_at.getTime()).toBeGreaterThan(
      notifications[1].notification_sent_at.getTime()
    );
    expect(notifications[1].notification_sent_at.getTime()).toBeGreaterThan(
      notifications[2].notification_sent_at.getTime()
    );

    // Verify all notifications belong to the correct user
    notifications.forEach(notification => {
      expect(notification.user_id).toBe(userId);
    });
  });

  it('should return only notifications for specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        first_name: 'User',
        last_name: 'One',
        phone_number: '+1111111111'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        first_name: 'User',
        last_name: 'Two',
        phone_number: '+2222222222'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create notifications for both users
    await db.insert(rewardNotificationsTable)
      .values([
        {
          user_id: user1Id,
          reward_claimed: false
        },
        {
          user_id: user1Id,
          reward_claimed: true
        },
        {
          user_id: user2Id,
          reward_claimed: false
        }
      ])
      .execute();

    const user1Notifications = await getUserRewardNotifications(user1Id);
    const user2Notifications = await getUserRewardNotifications(user2Id);

    expect(user1Notifications).toHaveLength(2);
    expect(user2Notifications).toHaveLength(1);

    // Verify notifications belong to correct users
    user1Notifications.forEach(notification => {
      expect(notification.user_id).toBe(user1Id);
    });

    user2Notifications.forEach(notification => {
      expect(notification.user_id).toBe(user2Id);
    });
  });

  it('should return notifications with correct fields', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        phone_number: '+1555555555'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a claimed notification
    const claimedAt = new Date();
    await db.insert(rewardNotificationsTable)
      .values({
        user_id: userId,
        reward_claimed: true,
        reward_claimed_at: claimedAt
      })
      .execute();

    // Create an unclaimed notification
    await db.insert(rewardNotificationsTable)
      .values({
        user_id: userId,
        reward_claimed: false
      })
      .execute();

    const notifications = await getUserRewardNotifications(userId);

    expect(notifications).toHaveLength(2);

    // Check claimed notification
    const claimedNotification = notifications.find(n => n.reward_claimed);
    expect(claimedNotification).toBeDefined();
    expect(claimedNotification!.id).toBeDefined();
    expect(claimedNotification!.user_id).toBe(userId);
    expect(claimedNotification!.notification_sent_at).toBeInstanceOf(Date);
    expect(claimedNotification!.reward_claimed).toBe(true);
    expect(claimedNotification!.reward_claimed_at).toBeInstanceOf(Date);

    // Check unclaimed notification
    const unclaimedNotification = notifications.find(n => !n.reward_claimed);
    expect(unclaimedNotification).toBeDefined();
    expect(unclaimedNotification!.id).toBeDefined();
    expect(unclaimedNotification!.user_id).toBe(userId);
    expect(unclaimedNotification!.notification_sent_at).toBeInstanceOf(Date);
    expect(unclaimedNotification!.reward_claimed).toBe(false);
    expect(unclaimedNotification!.reward_claimed_at).toBeNull();
  });

  it('should return empty array for non-existent user', async () => {
    const notifications = await getUserRewardNotifications(999999);
    expect(notifications).toEqual([]);
  });
});
