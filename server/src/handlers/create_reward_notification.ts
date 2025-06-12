
import { db } from '../db';
import { rewardNotificationsTable } from '../db/schema';
import { type RewardNotification } from '../schema';

export const createRewardNotification = async (userId: number): Promise<RewardNotification> => {
  try {
    const result = await db.insert(rewardNotificationsTable)
      .values({
        user_id: userId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Reward notification creation failed:', error);
    throw error;
  }
};
