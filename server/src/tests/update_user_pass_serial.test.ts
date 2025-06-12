
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { updateUserPassSerial } from '../handlers/update_user_pass_serial';
import { eq } from 'drizzle-orm';

// Test user data
const testUserInput: CreateUserInput = {
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
};

describe('updateUserPassSerial', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user pass serial number', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
      })
      .returning()
      .execute();

    const user = userResult[0];
    const passSerialNumber = 'PASS12345';

    // Update the pass serial number
    const result = await updateUserPassSerial(user.id, passSerialNumber);

    // Verify the returned user data
    expect(result.id).toBe(user.id);
    expect(result.first_name).toBe('John');
    expect(result.last_name).toBe('Doe');
    expect(result.phone_number).toBe('+1234567890');
    expect(result.pass_serial_number).toBe(passSerialNumber);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should save updated pass serial number to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
      })
      .returning()
      .execute();

    const user = userResult[0];
    const passSerialNumber = 'PASS67890';

    // Update the pass serial number
    await updateUserPassSerial(user.id, passSerialNumber);

    // Query the database to verify the update
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    expect(updatedUsers[0].pass_serial_number).toBe(passSerialNumber);
    expect(updatedUsers[0].updated_at).toBeInstanceOf(Date);
    expect(updatedUsers[0].updated_at > user.updated_at).toBe(true);
  });

  it('should update pass serial number for existing user with pass', async () => {
    // Create a test user with an existing pass serial number
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        pass_serial_number: 'OLD_PASS123'
      })
      .returning()
      .execute();

    const user = userResult[0];
    const newPassSerialNumber = 'NEW_PASS456';

    // Update to new pass serial number
    const result = await updateUserPassSerial(user.id, newPassSerialNumber);

    // Verify the pass serial number was updated
    expect(result.pass_serial_number).toBe(newPassSerialNumber);
    expect(result.pass_serial_number).not.toBe('OLD_PASS123');
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentUserId = 999;
    const passSerialNumber = 'PASS12345';

    // Attempt to update non-existent user
    await expect(updateUserPassSerial(nonExistentUserId, passSerialNumber))
      .rejects
      .toThrow(/User with id 999 not found/i);
  });

  it('should handle empty pass serial number', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
      })
      .returning()
      .execute();

    const user = userResult[0];
    const emptyPassSerial = '';

    // Update with empty pass serial number
    const result = await updateUserPassSerial(user.id, emptyPassSerial);

    // Verify the empty string was set
    expect(result.pass_serial_number).toBe('');
  });

  it('should preserve other user fields when updating pass serial', async () => {
    // Create a test user with existing data
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        total_visits: 3,
        current_reward_points: 2
      })
      .returning()
      .execute();

    const user = userResult[0];
    const passSerialNumber = 'PASS12345';

    // Update the pass serial number
    const result = await updateUserPassSerial(user.id, passSerialNumber);

    // Verify other fields are preserved
    expect(result.first_name).toBe(user.first_name);
    expect(result.last_name).toBe(user.last_name);
    expect(result.phone_number).toBe(user.phone_number);
    expect(result.total_visits).toBe(user.total_visits);
    expect(result.current_reward_points).toBe(user.current_reward_points);
    expect(result.pass_serial_number).toBe(passSerialNumber);
  });
});
