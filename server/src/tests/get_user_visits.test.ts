
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, visitsTable } from '../db/schema';
import { getUserVisits } from '../handlers/get_user_visits';

describe('getUserVisits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return visits for a user ordered by visited_at descending', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test visits with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(visitsTable)
      .values([
        {
          user_id: userId,
          pass_serial_number: 'PASS123',
          visited_at: twoHoursAgo,
          reward_points_earned: 1,
          is_reward_visit: false
        },
        {
          user_id: userId,
          pass_serial_number: 'PASS123',
          visited_at: now,
          reward_points_earned: 1,
          is_reward_visit: false
        },
        {
          user_id: userId,
          pass_serial_number: 'PASS123',
          visited_at: oneHourAgo,
          reward_points_earned: 1,
          is_reward_visit: false
        }
      ])
      .execute();

    const visits = await getUserVisits(userId);

    // Should return 3 visits
    expect(visits).toHaveLength(3);

    // Should be ordered by visited_at descending (most recent first)
    expect(visits[0].visited_at).toEqual(now);
    expect(visits[1].visited_at).toEqual(oneHourAgo);
    expect(visits[2].visited_at).toEqual(twoHoursAgo);

    // Verify all visits belong to the correct user
    visits.forEach(visit => {
      expect(visit.user_id).toEqual(userId);
      expect(visit.pass_serial_number).toEqual('PASS123');
    });
  });

  it('should return empty array for user with no visits', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '+9876543210'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const visits = await getUserVisits(userId);

    expect(visits).toHaveLength(0);
  });

  it('should only return visits for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        first_name: 'User',
        last_name: 'One',
        phone_number: '+1111111111'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        first_name: 'User',
        last_name: 'Two',
        phone_number: '+2222222222'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create visits for both users
    await db.insert(visitsTable)
      .values([
        {
          user_id: user1Id,
          pass_serial_number: 'PASS111',
          reward_points_earned: 1,
          is_reward_visit: false
        },
        {
          user_id: user2Id,
          pass_serial_number: 'PASS222',
          reward_points_earned: 1,
          is_reward_visit: false
        },
        {
          user_id: user1Id,
          pass_serial_number: 'PASS111',
          reward_points_earned: 1,
          is_reward_visit: false
        }
      ])
      .execute();

    const user1Visits = await getUserVisits(user1Id);
    const user2Visits = await getUserVisits(user2Id);

    // User 1 should have 2 visits
    expect(user1Visits).toHaveLength(2);
    user1Visits.forEach(visit => {
      expect(visit.user_id).toEqual(user1Id);
      expect(visit.pass_serial_number).toEqual('PASS111');
    });

    // User 2 should have 1 visit
    expect(user2Visits).toHaveLength(1);
    expect(user2Visits[0].user_id).toEqual(user2Id);
    expect(user2Visits[0].pass_serial_number).toEqual('PASS222');
  });

  it('should handle reward visits correctly', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        first_name: 'Reward',
        last_name: 'User',
        phone_number: '+5555555555'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a mix of regular and reward visits
    await db.insert(visitsTable)
      .values([
        {
          user_id: userId,
          pass_serial_number: 'PASS555',
          reward_points_earned: 1,
          is_reward_visit: false
        },
        {
          user_id: userId,
          pass_serial_number: 'PASS555',
          reward_points_earned: 1,
          is_reward_visit: true // This is a reward visit
        }
      ])
      .execute();

    const visits = await getUserVisits(userId);

    expect(visits).toHaveLength(2);
    
    // Find the reward visit
    const rewardVisit = visits.find(visit => visit.is_reward_visit === true);
    const regularVisit = visits.find(visit => visit.is_reward_visit === false);

    expect(rewardVisit).toBeDefined();
    expect(regularVisit).toBeDefined();
    expect(rewardVisit!.is_reward_visit).toBe(true);
    expect(regularVisit!.is_reward_visit).toBe(false);
  });
});
