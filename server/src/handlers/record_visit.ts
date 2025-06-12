
import { db } from '../db';
import { usersTable, visitsTable } from '../db/schema';
import { type RecordVisitInput, type Visit, type User } from '../schema';
import { eq } from 'drizzle-orm';

export interface RecordVisitResult {
  visit: Visit;
  user: User;
  isRewardEligible: boolean;
  rewardTriggered: boolean;
}

export const recordVisit = async (input: RecordVisitInput): Promise<RecordVisitResult> => {
  try {
    // Find user by pass serial number
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.pass_serial_number, input.pass_serial_number))
      .execute();

    if (users.length === 0) {
      throw new Error(`User not found with pass serial number: ${input.pass_serial_number}`);
    }

    const user = users[0];
    
    // Calculate new visit count and reward points
    const newVisitCount = user.total_visits + 1;
    const newRewardPoints = user.current_reward_points + 1;
    
    // Check if this visit triggers a reward (every 5 visits)
    const rewardTriggered = newRewardPoints >= 5;
    
    // Reset reward points to 0 if reward is triggered, otherwise keep accumulating
    const finalRewardPoints = rewardTriggered ? 0 : newRewardPoints;
    
    // Record the visit
    const visitResult = await db.insert(visitsTable)
      .values({
        user_id: user.id,
        pass_serial_number: input.pass_serial_number,
        reward_points_earned: 1,
        is_reward_visit: rewardTriggered
      })
      .returning()
      .execute();

    const visit = visitResult[0];

    // Update user's visit count and reward points
    const updatedUserResult = await db.update(usersTable)
      .set({
        total_visits: newVisitCount,
        current_reward_points: finalRewardPoints,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, user.id))
      .returning()
      .execute();

    const updatedUser = updatedUserResult[0];

    // Calculate if user is eligible for reward (has 5+ points)
    const isRewardEligible = updatedUser.current_reward_points >= 5;

    return {
      visit,
      user: updatedUser,
      isRewardEligible,
      rewardTriggered
    };
  } catch (error) {
    console.error('Visit recording failed:', error);
    throw error;
  }
};
