
import { type RecordVisitInput, type Visit, type User } from '../schema';

export interface RecordVisitResult {
  visit: Visit;
  user: User;
  isRewardEligible: boolean;
  rewardTriggered: boolean;
}

export declare function recordVisit(input: RecordVisitInput): Promise<RecordVisitResult>;
