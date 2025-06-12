
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUserByPhone } from '../handlers/get_user_by_phone';

const testUser: CreateUserInput = {
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
};

describe('getUserByPhone', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found by phone number', async () => {
    // Create a test user
    const insertedUsers = await db.insert(usersTable)
      .values({
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        phone_number: testUser.phone_number
      })
      .returning()
      .execute();

    const result = await getUserByPhone(testUser.phone_number);

    expect(result).not.toBeNull();
    expect(result?.first_name).toEqual('John');
    expect(result?.last_name).toEqual('Doe');
    expect(result?.phone_number).toEqual('+1234567890');
    expect(result?.total_visits).toEqual(0);
    expect(result?.current_reward_points).toEqual(0);
    expect(result?.pass_serial_number).toBeNull();
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const result = await getUserByPhone('+9999999999');
    expect(result).toBeNull();
  });

  it('should find user with exact phone number match', async () => {
    // Create multiple users with different phone numbers
    await db.insert(usersTable)
      .values([
        {
          first_name: 'Alice',
          last_name: 'Smith',
          phone_number: '+1111111111'
        },
        {
          first_name: 'Bob',
          last_name: 'Johnson',
          phone_number: '+2222222222'
        }
      ])
      .execute();

    const result = await getUserByPhone('+2222222222');

    expect(result).not.toBeNull();
    expect(result?.first_name).toEqual('Bob');
    expect(result?.last_name).toEqual('Johnson');
    expect(result?.phone_number).toEqual('+2222222222');
  });

  it('should handle users with existing visit data', async () => {
    // Create a user with some visit history
    await db.insert(usersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Wilson',
        phone_number: '+5555555555',
        total_visits: 3,
        current_reward_points: 3,
        pass_serial_number: 'PASS123456'
      })
      .execute();

    const result = await getUserByPhone('+5555555555');

    expect(result).not.toBeNull();
    expect(result?.first_name).toEqual('Jane');
    expect(result?.total_visits).toEqual(3);
    expect(result?.current_reward_points).toEqual(3);
    expect(result?.pass_serial_number).toEqual('PASS123456');
  });
});
