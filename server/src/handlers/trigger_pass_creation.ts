
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

// Reward system constants - updated to 5 visits
export const REWARD_THRESHOLD = 5;

export const triggerPassCreation = async (request: PassCreationRequest): Promise<PassCreationResponse> => {
  try {
    // Generate a unique pass serial number
    const passSerialNumber = `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Simulate external pass creation service call
    // In a real implementation, this would make an HTTP request to the pass creation service
    // For now, we'll simulate a successful response
    
    // Basic validation
    if (!request.firstName.trim() || !request.lastName.trim() || !request.phoneNumber.trim()) {
      return {
        success: false,
        message: 'Missing required fields: firstName, lastName, and phoneNumber are required'
      };
    }

    if (request.userId <= 0) {
      return {
        success: false,
        message: 'Invalid userId: must be a positive number'
      };
    }

    // Simulate async operation (like HTTP request)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate successful pass creation
    return {
      success: true,
      message: 'Pass creation triggered successfully',
      passSerialNumber
    };
  } catch (error) {
    console.error('Pass creation failed:', error);
    return {
      success: false,
      message: 'Pass creation service temporarily unavailable'
    };
  }
};
