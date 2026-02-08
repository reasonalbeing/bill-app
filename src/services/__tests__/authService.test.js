import {
  registerUser,
  loginUser,
  resetPassword,
  logoutUser,
  onAuthChange,
  getCurrentUser,
} from '../authService';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = null;
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const result = await registerUser('test@example.com', 'password123', 'testuser');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error when registration fails', async () => {
      const mockError = new Error('Email already in use');
      createUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(registerUser('test@example.com', 'password123', 'testuser')).rejects.toThrow('Email already in use');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const result = await loginUser('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error when login fails', async () => {
      const mockError = new Error('Invalid credentials');
      signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      sendPasswordResetEmail.mockResolvedValue();

      const result = await resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
      expect(result).toBe(true);
    });

    it('should throw error when sending reset email fails', async () => {
      const mockError = new Error('User not found');
      sendPasswordResetEmail.mockRejectedValue(mockError);

      await expect(resetPassword('nonexistent@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      signOut.mockResolvedValue();

      const result = await logoutUser();

      expect(signOut).toHaveBeenCalledWith(auth);
      expect(result).toBe(true);
    });

    it('should throw error when logout fails', async () => {
      const mockError = new Error('Network error');
      signOut.mockRejectedValue(mockError);

      await expect(logoutUser()).rejects.toThrow('Network error');
    });
  });

  describe('onAuthChange', () => {
    it('should set up auth state listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(mockCallback);

      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when logged in', () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      auth.currentUser = mockUser;

      const result = getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is logged in', () => {
      auth.currentUser = null;

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
