
import { db } from '../db';
import { rewardNotificationsTable } from '../db/schema';
import { type RewardNotification } from '../schema';
import { eq } from 'drizzle-orm';

export const claimReward = async (notificationId: number): Promise<RewardNotification> => {
  try {
    // Update the reward notification to mark it as claimed
    const result = await db.update(rewardNotificationsTable)
      .set({
        reward_claimed: true,
        reward_claimed_at: new Date()
      })
      .where(eq(rewardNotificationsTable.id, notificationId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Reward notification not found');
    }

    return result[0];
  } catch (error) {
    console.error('Reward claim failed:', error);
    throw error;
  }
};
