
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

const testUserInput: CreateUserInput = {
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
};

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user with reward stats when user exists', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        current_reward_points: 3
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserById(userId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.phone_number).toEqual('+1234567890');
    expect(result!.current_reward_points).toEqual(3);
    expect(result!.is_eligible_for_reward).toBe(false);
    expect(result!.visits_until_reward).toEqual(2);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const result = await getUserById(999);
    expect(result).toBeNull();
  });

  it('should show user is eligible for reward with 5 points', async () => {
    // Create user with exactly 5 reward points
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        current_reward_points: 5
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserById(userId);

    expect(result).toBeDefined();
    expect(result!.current_reward_points).toEqual(5);
    expect(result!.is_eligible_for_reward).toBe(true);
    expect(result!.visits_until_reward).toEqual(0);
  });

  it('should show user is eligible for reward with more than 5 points', async () => {
    // Create user with more than 5 reward points
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        current_reward_points: 7
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserById(userId);

    expect(result).toBeDefined();
    expect(result!.current_reward_points).toEqual(7);
    expect(result!.is_eligible_for_reward).toBe(true);
    expect(result!.visits_until_reward).toEqual(0);
  });

  it('should calculate correct visits until reward for new user', async () => {
    // Create new user with default 0 reward points
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number
        // current_reward_points defaults to 0
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserById(userId);

    expect(result).toBeDefined();
    expect(result!.current_reward_points).toEqual(0);
    expect(result!.is_eligible_for_reward).toBe(false);
    expect(result!.visits_until_reward).toEqual(5);
  });

  it('should calculate correct visits until reward for user with partial progress', async () => {
    // Create user with 2 reward points
    const userResult = await db.insert(usersTable)
      .values({
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        phone_number: testUserInput.phone_number,
        current_reward_points: 2
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserById(userId);

    expect(result).toBeDefined();
    expect(result!.current_reward_points).toEqual(2);
    expect(result!.is_eligible_for_reward).toBe(false);
    expect(result!.visits_until_reward).toEqual(3);
  });
});
