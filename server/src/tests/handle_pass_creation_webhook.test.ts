
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type PassCreationWebhookPayload, type CreateUserInput } from '../schema';
import { handlePassCreationWebhook } from '../handlers/handle_pass_creation_webhook';
import { eq } from 'drizzle-orm';

// Test payload
const testPayload: PassCreationWebhookPayload = {
  user_id: 1,
  pass_serial_number: 'PASS-123456',
  pass_url: 'https://example.com/pass/123456',
  pass_type: 'apple'
};

// Test user input
const testUserInput: CreateUserInput = {
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
};

describe('handlePassCreationWebhook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user with pass serial number', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
      })
      .returning()
      .execute();

    const testUser = userResult[0];
    const payload = { ...testPayload, user_id: testUser.id };

    // Handle the webhook
    const result = await handlePassCreationWebhook(payload);

    // Verify the returned user has the pass serial number
    expect(result.pass_serial_number).toEqual('PASS-123456');
    expect(result.id).toEqual(testUser.id);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone_number).toEqual('+1234567890');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pass serial number to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
      })
      .returning()
      .execute();

    const testUser = userResult[0];
    const payload = { ...testPayload, user_id: testUser.id };

    // Handle the webhook
    await handlePassCreationWebhook(payload);

    // Verify the pass serial number was saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].pass_serial_number).toEqual('PASS-123456');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const payload = { ...testPayload, user_id: 999 };

    await expect(handlePassCreationWebhook(payload))
      .rejects.toThrow(/User with ID 999 not found/i);
  });

  it('should update existing pass serial number', async () => {
    // Create a test user with an existing pass serial number
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        pass_serial_number: 'OLD-PASS-123'
      })
      .returning()
      .execute();

    const testUser = userResult[0];
    const payload = { ...testPayload, user_id: testUser.id };

    // Handle the webhook with new pass serial number
    const result = await handlePassCreationWebhook(payload);

    // Verify the pass serial number was updated
    expect(result.pass_serial_number).toEqual('PASS-123456');
    
    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUser.id))
      .execute();

    expect(users[0].pass_serial_number).toEqual('PASS-123456');
  });
});
