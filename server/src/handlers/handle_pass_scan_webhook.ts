
import { type PassScanWebhookPayload } from '../schema';
import { type RecordVisitResult } from './record_visit';

export declare function handlePassScanWebhook(payload: PassScanWebhookPayload): Promise<RecordVisitResult>;
