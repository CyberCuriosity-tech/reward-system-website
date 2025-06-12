
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '../schema';

export const updateUserPassSerial = async (userId: number, passSerialNumber: string): Promise<User> => {
  try {
    // Update the user's pass serial number
    const result = await db.update(usersTable)
      .set({
        pass_serial_number: passSerialNumber,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, userId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to update user pass serial number:', error);
    throw error;
  }
};
