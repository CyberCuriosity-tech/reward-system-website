
import { db } from '../db';
import { rewardNotificationsTable } from '../db/schema';

export interface RewardNotificationRequest {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  totalVisits: number;
}

export interface RewardNotificationResponse {
  success: boolean;
  message: string;
}

export const triggerRewardNotification = async (
  request: RewardNotificationRequest
): Promise<RewardNotificationResponse> => {
  try {
    // Create reward notification record
    await db.insert(rewardNotificationsTable)
      .values({
        user_id: request.userId,
        notification_sent_at: new Date(),
        reward_claimed: false,
        reward_claimed_at: null
      })
      .execute();

    // In a real implementation, this would trigger actual notification sending
    // (SMS, push notification, etc.) using the provided user details
    console.log(`Reward notification triggered for ${request.firstName} ${request.lastName} (${request.phoneNumber}) - Visit #${request.totalVisits}`);

    return {
      success: true,
      message: `Reward notification sent successfully for user ${request.userId}`
    };
  } catch (error) {
    console.error('Failed to trigger reward notification:', error);
    throw error;
  }
};
