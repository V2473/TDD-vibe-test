// Import mocked modules
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { POST } from './route';

// Use global mocks
const mockPrisma = { user: (global as any).__mockUserMethods };

describe('/api/auth/login', () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
    };
  });

  describe('POST', () => {
    it('should return 400 if email or password is missing', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email and password are required');
    });

    it('should return 401 if user not found', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'password' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Invalid credentials');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return 401 if password is invalid', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'wrong-password' });
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashed-password' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });

    it('should login successfully and return token', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'password' });
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashed-password' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe('jwt-token');
      expect(data.user).toEqual({ id: 1, email: 'test@example.com' });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, email: 'test@example.com' },
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    it('should handle bcrypt compare error', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'password' });
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashed-password' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });

    it('should handle JWT sign error', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'password' });
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashed-password' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT error');
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });

    it('should handle database error', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'password' });
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });

    it('should handle invalid JSON', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });
  });
});