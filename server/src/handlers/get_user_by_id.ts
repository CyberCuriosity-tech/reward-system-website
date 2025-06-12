
import { type User } from '../schema';

export declare function getUserById(userId: number): Promise<User | null>;
