
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type PassCreationWebhookPayload, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const handlePassCreationWebhook = async (payload: PassCreationWebhookPayload): Promise<User> => {
  try {
    // Update user with pass serial number
    const result = await db.update(usersTable)
      .set({
        pass_serial_number: payload.pass_serial_number,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, payload.user_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with ID ${payload.user_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Pass creation webhook handling failed:', error);
    throw error;
  }
};
