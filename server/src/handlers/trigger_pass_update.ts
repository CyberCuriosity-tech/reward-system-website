
export interface PassUpdateRequest {
  passSerialNumber: string;
  rewardPoints: number;
  totalVisits: number;
}

export interface PassUpdateResponse {
  success: boolean;
  message: string;
}

export declare function triggerPassUpdate(request: PassUpdateRequest): Promise<PassUpdateResponse>;
