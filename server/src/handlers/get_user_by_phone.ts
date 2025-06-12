
import { type User } from '../schema';

export declare function getUserByPhone(phoneNumber: string): Promise<User | null>;
