
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        phone_number: input.phone_number
        // total_visits and current_reward_points have default values (0)
        // pass_serial_number is nullable and will be set later
        // created_at and updated_at have default values (now)
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
