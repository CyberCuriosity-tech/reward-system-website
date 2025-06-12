
export interface PassCreationRequest {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface PassCreationResponse {
  success: boolean;
  message: string;
  passSerialNumber?: string;
}

export declare function triggerPassCreation(request: PassCreationRequest): Promise<PassCreationResponse>;
