// Import mocked modules
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { POST } from './route';

// Use global mocks
const mockPrisma = { user: (global as any).__mockUserMethods };

describe('/api/auth/register', () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      json: jest.fn(),
    };
  });

  describe('POST', () => {
    it('should return 400 if email is missing', async () => {
      mockRequest.json.mockResolvedValue({ password: 'password123', confirmPassword: 'password123' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email, password, and confirm password are required');
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', confirmPassword: 'password123' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email, password, and confirm password are required');
    });

    it('should return 400 if confirmPassword is missing', async () => {
      mockRequest.json.mockResolvedValue({ email: 'test@example.com', password: 'password123' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email, password, and confirm password are required');
    });

    it('should return 400 if email format is invalid', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123'
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address');
    });

    it('should return 400 if password is too short', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short'
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Password must be at least 8 characters');
    });

    it('should return 400 if passwords do not match', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password456'
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Passwords do not match');
    });

    it('should return 409 if email already exists', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'existing@example.com',
        password: 'password123!A',
        confirmPassword: 'password123!A'
      });
      const existingUser = { id: 1, email: 'existing@example.com', password: 'hashed_password' };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('An account with this email already exists');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' },
      });
    });

    it('should register successfully and return token', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'new@example.com',
        password: 'password123!A',
        confirmPassword: 'password123!A'
      });

      // Mock no existing user
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock user creation
      const newUser = { id: 2, email: 'new@example.com', password: 'hashed_password' };
      mockPrisma.user.create.mockResolvedValue(newUser);

      // Mock bcrypt hash and JWT sign
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe('jwt-token');
      expect(data.user).toEqual({ id: 2, email: 'new@example.com' });
      expect(data.message).toBe('Account created successfully');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123!A', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'hashed_password',
        },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 2, email: 'new@example.com' },
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    it('should handle bcrypt hash error', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'password123!A',
        confirmPassword: 'password123!A'
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });

    it('should handle JWT sign error', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'new@example.com',
        password: 'password123!A',
        confirmPassword: 'password123!A'
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      const newUser = { id: 2, email: 'new@example.com', password: 'hashed_password' };
      mockPrisma.user.create.mockResolvedValue(newUser);
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT error');
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
    });

    it('should handle user creation error', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'new@example.com',
        password: 'password123!A',
        confirmPassword: 'password123!A'
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

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