
import { describe, it, expect } from 'bun:test';
import { triggerPassCreation, REWARD_THRESHOLD, type PassCreationRequest } from '../handlers/trigger_pass_creation';

const validRequest: PassCreationRequest = {
  userId: 1,
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '+1234567890'
};

describe('triggerPassCreation', () => {
  it('should create pass successfully with valid input', async () => {
    const result = await triggerPassCreation(validRequest);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Pass creation triggered successfully');
    expect(result.passSerialNumber).toBeDefined();
    expect(result.passSerialNumber).toMatch(/^PASS-\d+-[A-Z0-9]{6}$/);
  });

  it('should generate unique pass serial numbers', async () => {
    const result1 = await triggerPassCreation(validRequest);
    const result2 = await triggerPassCreation(validRequest);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.passSerialNumber).not.toBe(result2.passSerialNumber);
  });

  it('should fail with missing firstName', async () => {
    const invalidRequest = {
      ...validRequest,
      firstName: ''
    };

    const result = await triggerPassCreation(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Missing required fields: firstName, lastName, and phoneNumber are required');
    expect(result.passSerialNumber).toBeUndefined();
  });

  it('should fail with missing lastName', async () => {
    const invalidRequest = {
      ...validRequest,
      lastName: '   '
    };

    const result = await triggerPassCreation(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Missing required fields: firstName, lastName, and phoneNumber are required');
    expect(result.passSerialNumber).toBeUndefined();
  });

  it('should fail with missing phoneNumber', async () => {
    const invalidRequest = {
      ...validRequest,
      phoneNumber: ''
    };

    const result = await triggerPassCreation(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Missing required fields: firstName, lastName, and phoneNumber are required');
    expect(result.passSerialNumber).toBeUndefined();
  });

  it('should fail with invalid userId', async () => {
    const invalidRequest = {
      ...validRequest,
      userId: 0
    };

    const result = await triggerPassCreation(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid userId: must be a positive number');
    expect(result.passSerialNumber).toBeUndefined();
  });

  it('should fail with negative userId', async () => {
    const invalidRequest = {
      ...validRequest,
      userId: -1
    };

    const result = await triggerPassCreation(invalidRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid userId: must be a positive number');
    expect(result.passSerialNumber).toBeUndefined();
  });

  it('should handle whitespace in required fields', async () => {
    const requestWithWhitespace = {
      userId: 1,
      firstName: '  John  ',
      lastName: '  Doe  ',
      phoneNumber: '  +1234567890  '
    };

    const result = await triggerPassCreation(requestWithWhitespace);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Pass creation triggered successfully');
    expect(result.passSerialNumber).toBeDefined();
  });
});

describe('REWARD_THRESHOLD constant', () => {
  it('should be set to 5 visits', () => {
    expect(REWARD_THRESHOLD).toBe(5);
    expect(typeof REWARD_THRESHOLD).toBe('number');
  });
});
