
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UserWithStats } from '../schema';
import { eq } from 'drizzle-orm';

const VISITS_REQUIRED_FOR_REWARD = 5;

export const getUserWithStats = async (userId: number): Promise<UserWithStats | null> => {
  try {
    // Get user data
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Calculate reward eligibility
    const is_eligible_for_reward = user.current_reward_points >= VISITS_REQUIRED_FOR_REWARD;
    const visits_until_reward = is_eligible_for_reward 
      ? 0 
      : VISITS_REQUIRED_FOR_REWARD - user.current_reward_points;

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      total_visits: user.total_visits,
      current_reward_points: user.current_reward_points,
      pass_serial_number: user.pass_serial_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_eligible_for_reward,
      visits_until_reward
    };
  } catch (error) {
    console.error('Get user with stats failed:', error);
    throw error;
  }
};
