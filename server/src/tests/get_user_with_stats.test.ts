
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUserWithStats } from '../handlers/get_user_with_stats';

// Test user data
const testUserInput: CreateUserInput = {
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
};

describe('getUserWithStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent user', async () => {
    const result = await getUserWithStats(999);
    expect(result).toBeNull();
  });

  it('should return user with stats for new user', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
      })
      .returning()
      .execute();

    const userId = users[0].id;

    const result = await getUserWithStats(userId);

    expect(result).toBeDefined();
    expect(result!.id).toBe(userId);
    expect(result!.first_name).toBe('John');
    expect(result!.last_name).toBe('Doe');
    expect(result!.phone_number).toBe('+1234567890');
    expect(result!.total_visits).toBe(0);
    expect(result!.current_reward_points).toBe(0);
    expect(result!.pass_serial_number).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.is_eligible_for_reward).toBe(false);
    expect(result!.visits_until_reward).toBe(5);
  });

  it('should calculate reward eligibility correctly with 3 visits', async () => {
    // Create a user with 3 visits
    const users = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        total_visits: 3,
        current_reward_points: 3
      })
      .returning()
      .execute();

    const userId = users[0].id;

    const result = await getUserWithStats(userId);

    expect(result).toBeDefined();
    expect(result!.total_visits).toBe(3);
    expect(result!.current_reward_points).toBe(3);
    expect(result!.is_eligible_for_reward).toBe(false);
    expect(result!.visits_until_reward).toBe(2);
  });

  it('should mark user as eligible for reward at 5 visits', async () => {
    // Create a user with 5 visits
    const users = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        total_visits: 5,
        current_reward_points: 5
      })
      .returning()
      .execute();

    const userId = users[0].id;

    const result = await getUserWithStats(userId);

    expect(result).toBeDefined();
    expect(result!.total_visits).toBe(5);
    expect(result!.current_reward_points).toBe(5);
    expect(result!.is_eligible_for_reward).toBe(true);
    expect(result!.visits_until_reward).toBe(0);
  });

  it('should handle user with reward points reset after claiming', async () => {
    // Create a user who has claimed a reward (points reset to 0, but has 7 total visits)
    const users = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        total_visits: 7,
        current_reward_points: 2, // Reset after 5 visits, then 2 more visits
        pass_serial_number: 'PASS123456'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    const result = await getUserWithStats(userId);

    expect(result).toBeDefined();
    expect(result!.total_visits).toBe(7);
    expect(result!.current_reward_points).toBe(2);
    expect(result!.is_eligible_for_reward).toBe(false);
    expect(result!.visits_until_reward).toBe(3);
    expect(result!.pass_serial_number).toBe('PASS123456');
  });

  it('should handle user with more than 5 reward points', async () => {
    // Create a user with 6 reward points (eligible for reward)
    const users = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        total_visits: 6,
        current_reward_points: 6
      })
      .returning()
      .execute();

    const userId = users[0].id;

    const result = await getUserWithStats(userId);

    expect(result).toBeDefined();
    expect(result!.total_visits).toBe(6);
    expect(result!.current_reward_points).toBe(6);
    expect(result!.is_eligible_for_reward).toBe(true);
    expect(result!.visits_until_reward).toBe(0);
  });
});
