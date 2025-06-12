
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UserWithStats } from '../schema';

const REWARD_THRESHOLD = 5;

export const getUserById = async (userId: number): Promise<UserWithStats | null> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    
    // Calculate reward statistics based on 5-visit threshold
    const is_eligible_for_reward = user.current_reward_points >= REWARD_THRESHOLD;
    const visits_until_reward = Math.max(0, REWARD_THRESHOLD - user.current_reward_points);

    return {
      ...user,
      is_eligible_for_reward,
      visits_until_reward
    };
  } catch (error) {
    console.error('Get user by ID failed:', error);
    throw error;
  }
};
