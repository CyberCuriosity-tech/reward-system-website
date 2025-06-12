
import { db } from '../db';
import { visitsTable } from '../db/schema';
import { type Visit } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserVisits = async (userId: number): Promise<Visit[]> => {
  try {
    const results = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.user_id, userId))
      .orderBy(desc(visitsTable.visited_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user visits:', error);
    throw error;
  }
};
