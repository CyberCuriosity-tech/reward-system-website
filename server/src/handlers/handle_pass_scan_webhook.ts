
import { db } from '../db';
import { usersTable, visitsTable } from '../db/schema';
import { type PassScanWebhookPayload } from '../schema';
import { eq } from 'drizzle-orm';

export interface RecordVisitResult {
  visit_id: number;
  user_id: number;
  reward_points_earned: number;
  total_visits: number;
  current_reward_points: number;
  is_reward_visit: boolean;
  is_eligible_for_reward: boolean;
}

export const handlePassScanWebhook = async (payload: PassScanWebhookPayload): Promise<RecordVisitResult> => {
  try {
    // Find user by pass serial number
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.pass_serial_number, payload.pass_serial_number))
      .execute();

    if (users.length === 0) {
      throw new Error(`User not found for pass serial number: ${payload.pass_serial_number}`);
    }

    const user = users[0];

    // Calculate new visit stats
    const newTotalVisits = user.total_visits + 1;
    const rewardPointsEarned = 1; // Standard points per visit
    const newRewardPoints = user.current_reward_points + rewardPointsEarned;
    
    // Check if this visit triggers a reward (every 5 visits)
    const isRewardVisit = newTotalVisits % 5 === 0;
    
    // If reward visit, reset reward points to 0, otherwise keep accumulating
    const finalRewardPoints = isRewardVisit ? 0 : newRewardPoints;
    
    // Record the visit
    const visitResult = await db.insert(visitsTable)
      .values({
        user_id: user.id,
        pass_serial_number: payload.pass_serial_number,
        visited_at: new Date(payload.scanned_at),
        reward_points_earned: rewardPointsEarned,
        is_reward_visit: isRewardVisit
      })
      .returning()
      .execute();

    const visit = visitResult[0];

    // Update user's visit count and reward points
    await db.update(usersTable)
      .set({
        total_visits: newTotalVisits,
        current_reward_points: finalRewardPoints,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, user.id))
      .execute();

    // Check if user will be eligible for reward after next visit
    const visitsUntilReward = 5 - (finalRewardPoints % 5);
    const isEligibleForReward = visitsUntilReward === 1; // Next visit will complete the cycle

    return {
      visit_id: visit.id,
      user_id: user.id,
      reward_points_earned: rewardPointsEarned,
      total_visits: newTotalVisits,
      current_reward_points: finalRewardPoints,
      is_reward_visit: isRewardVisit,
      is_eligible_for_reward: isEligibleForReward
    };
  } catch (error) {
    console.error('Pass scan webhook handling failed:', error);
    throw error;
  }
};
