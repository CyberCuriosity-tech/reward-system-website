
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

export declare function triggerRewardNotification(request: RewardNotificationRequest): Promise<RewardNotificationResponse>;
