
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testUserInput: CreateUserInput = {
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
};

const testUserInput2: CreateUserInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  phone_number: '+0987654321'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with correct basic information', async () => {
    const result = await createUser(testUserInput);

    // Verify basic user information
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone_number).toEqual('+1234567890');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should initialize user with default reward values', async () => {
    const result = await createUser(testUserInput);

    // Verify reward-related defaults are set correctly
    expect(result.total_visits).toEqual(0);
    expect(result.current_reward_points).toEqual(0);
    expect(result.pass_serial_number).toBeNull();
  });

  it('should set timestamps correctly', async () => {
    const result = await createUser(testUserInput);

    // Verify timestamp fields
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should save user to database correctly', async () => {
    const result = await createUser(testUserInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.first_name).toEqual('John');
    expect(savedUser.last_name).toEqual('Doe');
    expect(savedUser.phone_number).toEqual('+1234567890');
    expect(savedUser.total_visits).toEqual(0);
    expect(savedUser.current_reward_points).toEqual(0);
    expect(savedUser.pass_serial_number).toBeNull();
  });

  it('should enforce unique phone number constraint', async () => {
    // Create first user
    await createUser(testUserInput);

    // Attempt to create second user with same phone number
    const duplicateUserInput: CreateUserInput = {
      first_name: 'Different',
      last_name: 'Name',
      phone_number: '+1234567890' // Same phone number
    };

    // Should throw error due to unique constraint
    expect(async () => {
      await createUser(duplicateUserInput);
    }).toThrow();
  });

  it('should allow multiple users with different phone numbers', async () => {
    // Create first user
    const user1 = await createUser(testUserInput);
    
    // Create second user with different phone number
    const user2 = await createUser(testUserInput2);

    // Both should be created successfully
    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();
    expect(user1.id).not.toEqual(user2.id);
    
    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should create users with sequential IDs', async () => {
    const user1 = await createUser(testUserInput);
    const user2 = await createUser(testUserInput2);

    // IDs should be sequential (assuming clean database)
    expect(user2.id).toBeGreaterThan(user1.id);
  });

  it('should handle names with various characters', async () => {
    const specialNameInput: CreateUserInput = {
      first_name: "José-Marie",
      last_name: "O'Connor",
      phone_number: "+1-555-123-4567"
    };

    const result = await createUser(specialNameInput);

    expect(result.first_name).toEqual("José-Marie");
    expect(result.last_name).toEqual("O'Connor");
    expect(result.phone_number).toEqual("+1-555-123-4567");
  });
});
