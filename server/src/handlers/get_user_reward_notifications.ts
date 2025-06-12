
import { db } from '../db';
import { rewardNotificationsTable } from '../db/schema';
import { type RewardNotification } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserRewardNotifications = async (userId: number): Promise<RewardNotification[]> => {
  try {
    const results = await db.select()
      .from(rewardNotificationsTable)
      .where(eq(rewardNotificationsTable.user_id, userId))
      .orderBy(desc(rewardNotificationsTable.notification_sent_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user reward notifications:', error);
    throw error;
  }
};
