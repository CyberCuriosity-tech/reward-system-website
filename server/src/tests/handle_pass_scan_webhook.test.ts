
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, visitsTable } from '../db/schema';
import { type PassScanWebhookPayload } from '../schema';
import { handlePassScanWebhook } from '../handlers/handle_pass_scan_webhook';
import { eq } from 'drizzle-orm';

const testPayload: PassScanWebhookPayload = {
  pass_serial_number: 'TEST123456',
  scanned_at: '2024-01-15T12:00:00Z',
  location: 'Store Location'
};

describe('handlePassScanWebhook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should record first visit for user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await handlePassScanWebhook(testPayload);

    // Check return values
    expect(result.user_id).toEqual(user.id);
    expect(result.reward_points_earned).toEqual(1);
    expect(result.total_visits).toEqual(1);
    expect(result.current_reward_points).toEqual(1);
    expect(result.is_reward_visit).toBe(false);
    expect(result.is_eligible_for_reward).toBe(false);
    expect(result.visit_id).toBeDefined();
  });

  it('should trigger reward on 5th visit', async () => {
    // Create test user with 4 previous visits
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456',
        total_visits: 4,
        current_reward_points: 4
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await handlePassScanWebhook(testPayload);

    // Check return values - 5th visit should trigger reward
    expect(result.user_id).toEqual(user.id);
    expect(result.reward_points_earned).toEqual(1);
    expect(result.total_visits).toEqual(5);
    expect(result.current_reward_points).toEqual(0); // Reset after reward
    expect(result.is_reward_visit).toBe(true);
    expect(result.is_eligible_for_reward).toBe(false); // Not eligible until 4 more visits
  });

  it('should calculate eligibility correctly before reward visit', async () => {
    // Create test user with 3 previous visits
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456',
        total_visits: 3,
        current_reward_points: 3
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await handlePassScanWebhook(testPayload);

    // Check return values - 4th visit should make user eligible
    expect(result.total_visits).toEqual(4);
    expect(result.current_reward_points).toEqual(4);
    expect(result.is_reward_visit).toBe(false);
    expect(result.is_eligible_for_reward).toBe(true); // Next visit will trigger reward
  });

  it('should save visit record to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await handlePassScanWebhook(testPayload);

    // Verify visit was saved
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, result.visit_id))
      .execute();

    expect(visits).toHaveLength(1);
    expect(visits[0].user_id).toEqual(user.id);
    expect(visits[0].pass_serial_number).toEqual('TEST123456');
    expect(visits[0].reward_points_earned).toEqual(1);
    expect(visits[0].is_reward_visit).toBe(false);
    expect(visits[0].visited_at).toBeInstanceOf(Date);
  });

  it('should update user statistics in database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456',
        total_visits: 2,
        current_reward_points: 2
      })
      .returning()
      .execute();

    const user = userResult[0];

    await handlePassScanWebhook(testPayload);

    // Verify user was updated
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    expect(updatedUsers[0].total_visits).toEqual(3);
    expect(updatedUsers[0].current_reward_points).toEqual(3);
    expect(updatedUsers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple reward cycles correctly', async () => {
    // Create test user with 9 previous visits (4 rewards earned, 1 visit into 3rd cycle)
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456',
        total_visits: 9,
        current_reward_points: 4 // 9 % 5 = 4
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await handlePassScanWebhook(testPayload);

    // Check return values - 10th visit should trigger 2nd reward
    expect(result.total_visits).toEqual(10);
    expect(result.current_reward_points).toEqual(0); // Reset after reward
    expect(result.is_reward_visit).toBe(true);
    expect(result.is_eligible_for_reward).toBe(false);
  });

  it('should throw error for non-existent pass serial number', async () => {
    const invalidPayload: PassScanWebhookPayload = {
      pass_serial_number: 'NONEXISTENT',
      scanned_at: '2024-01-15T12:00:00Z',
      location: 'Store Location'
    };

    expect(handlePassScanWebhook(invalidPayload)).rejects.toThrow(/User not found/i);
  });

  it('should handle custom scanned_at timestamp', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'TEST123456'
      })
      .returning()
      .execute();

    const customPayload: PassScanWebhookPayload = {
      pass_serial_number: 'TEST123456',
      scanned_at: '2024-02-20T15:30:45Z',
      location: 'Custom Location'
    };

    const result = await handlePassScanWebhook(customPayload);

    // Verify visit timestamp matches payload
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, result.visit_id))
      .execute();

    expect(visits[0].visited_at).toEqual(new Date('2024-02-20T15:30:45Z'));
  });
});
