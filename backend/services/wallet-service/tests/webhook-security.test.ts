import { webhookRateLimiter } from '../src/middleware/webhook-security.middleware';

describe('Webhook Security Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    // Mock Express Request/Response
    req = { 
      ip: '127.0.0.1', 
      headers: {} 
    };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn() 
    };
    next = jest.fn();
  });

  test('Allow request under limit', () => {
    req.ip = '10.0.0.1'; // Unique IP
    
    webhookRateLimiter(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('Block request over limit (Rate Limiting)', () => {
    const ip = '10.0.0.2'; // Unique IP
    req.ip = ip;
    
    // Simulate 60 allowed requests
    for (let i = 0; i < 60; i++) {
       webhookRateLimiter(req, res, next);
    }
    
    // Assert next() called 60 times
    expect(next).toHaveBeenCalledTimes(60);
    
    // 61st attempt should be blocked
    webhookRateLimiter(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Too many') }));
  });
});
