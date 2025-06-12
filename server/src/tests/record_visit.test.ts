
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, visitsTable } from '../db/schema';
import { type RecordVisitInput } from '../schema';
import { recordVisit } from '../handlers/record_visit';
import { eq } from 'drizzle-orm';

// Test input
const testInput: RecordVisitInput = {
  pass_serial_number: 'PASS123'
};

describe('recordVisit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should record a visit for existing user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'PASS123'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await recordVisit(testInput);

    // Verify result structure
    expect(result.visit).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.isRewardEligible).toBe(false);
    expect(result.rewardTriggered).toBe(false);

    // Verify visit details
    expect(result.visit.user_id).toEqual(user.id);
    expect(result.visit.pass_serial_number).toEqual('PASS123');
    expect(result.visit.reward_points_earned).toEqual(1);
    expect(result.visit.is_reward_visit).toBe(false);

    // Verify user updates
    expect(result.user.total_visits).toEqual(1);
    expect(result.user.current_reward_points).toEqual(1);
  });

  it('should trigger reward after 5 visits', async () => {
    // Create test user with 4 visits and 4 reward points
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'PASS123',
        total_visits: 4,
        current_reward_points: 4
      })
      .returning()
      .execute();

    const result = await recordVisit(testInput);

    // Verify reward was triggered
    expect(result.rewardTriggered).toBe(true);
    expect(result.isRewardEligible).toBe(false); // Should be false after reset
    
    // Verify visit is marked as reward visit
    expect(result.visit.is_reward_visit).toBe(true);
    
    // Verify user stats after reward
    expect(result.user.total_visits).toEqual(5);
    expect(result.user.current_reward_points).toEqual(0); // Reset after reward
  });

  it('should make user eligible for reward at 5 points', async () => {
    // Create test user with 3 visits and 3 reward points
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'PASS123',
        total_visits: 3,
        current_reward_points: 3
      })
      .returning()
      .execute();

    const result = await recordVisit(testInput);

    // Verify user is not yet eligible (4 points)
    expect(result.isRewardEligible).toBe(false);
    expect(result.rewardTriggered).toBe(false);
    expect(result.user.current_reward_points).toEqual(4);

    // Record another visit to reach 5 points
    const secondResult = await recordVisit(testInput);

    // Now should trigger reward
    expect(secondResult.rewardTriggered).toBe(true);
    expect(secondResult.user.current_reward_points).toEqual(0); // Reset
  });

  it('should save visit to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'PASS123'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await recordVisit(testInput);

    // Query database to verify visit was saved
    const visits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, result.visit.id))
      .execute();

    expect(visits).toHaveLength(1);
    expect(visits[0].user_id).toEqual(user.id);
    expect(visits[0].pass_serial_number).toEqual('PASS123');
    expect(visits[0].reward_points_earned).toEqual(1);
    expect(visits[0].visited_at).toBeInstanceOf(Date);
  });

  it('should update user statistics in database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'PASS123',
        total_visits: 2,
        current_reward_points: 2
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await recordVisit(testInput);

    // Query database to verify user was updated
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    expect(updatedUsers[0].total_visits).toEqual(3);
    expect(updatedUsers[0].current_reward_points).toEqual(3);
    expect(updatedUsers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent pass serial number', async () => {
    const invalidInput: RecordVisitInput = {
      pass_serial_number: 'INVALID123'
    };

    expect(recordVisit(invalidInput)).rejects.toThrow(/User not found with pass serial number/i);
  });

  it('should handle multiple reward cycles correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        pass_serial_number: 'PASS123'
      })
      .returning()
      .execute();

    // Record 5 visits to trigger first reward
    let result;
    for (let i = 0; i < 5; i++) {
      result = await recordVisit(testInput);
    }

    // Verify first reward was triggered
    expect(result!.rewardTriggered).toBe(true);
    expect(result!.user.total_visits).toEqual(5);
    expect(result!.user.current_reward_points).toEqual(0);

    // Record 4 more visits
    for (let i = 0; i < 4; i++) {
      result = await recordVisit(testInput);
    }

    // Should not trigger reward yet
    expect(result!.rewardTriggered).toBe(false);
    expect(result!.user.total_visits).toEqual(9);
    expect(result!.user.current_reward_points).toEqual(4);

    // Record 5th visit to trigger second reward
    result = await recordVisit(testInput);

    // Verify second reward was triggered
    expect(result.rewardTriggered).toBe(true);
    expect(result.user.total_visits).toEqual(10);
    expect(result.user.current_reward_points).toEqual(0);
  });
});
