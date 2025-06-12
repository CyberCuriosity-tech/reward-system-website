
import { type PassCreationWebhookPayload, type User } from '../schema';

export declare function handlePassCreationWebhook(payload: PassCreationWebhookPayload): Promise<User>;
