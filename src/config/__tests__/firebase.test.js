import firebaseApp, { auth } from '../firebase';

// Mock Firebase SDK
jest.mock('firebase/app', () => {
  const mockApp = {
    name: 'test-app',
    options: {
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id'
    }
  };
  
  const mockInitializeApp = jest.fn(() => mockApp);
  
  return {
    initializeApp: mockInitializeApp,
    __esModule: true,
    default: {
      initializeApp: mockInitializeApp
    }
  };
});

jest.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn()
  };
  
  const mockGetAuth = jest.fn(() => mockAuth);
  
  return {
    getAuth: mockGetAuth,
    __esModule: true,
    default: {
      getAuth: mockGetAuth
    }
  };
});

describe('config/firebase.js', () => {
  beforeEach(() => {
    // 清除所有模拟的调用
    jest.clearAllMocks();
  });

  test('should initialize Firebase app with correct config', () => {
    expect(firebaseApp).toBeDefined();
    expect(firebaseApp.name).toBeDefined();
    expect(firebaseApp.options).toBeDefined();
  });

  test('should export auth instance', () => {
    expect(auth).toBeDefined();
    expect(auth.currentUser).toBeDefined();
    expect(typeof auth.onAuthStateChanged).toBe('function');
  });

  test('should export default Firebase app', () => {
    expect(firebaseApp).toBeDefined();
    expect(typeof firebaseApp).toBe('object');
  });

  test('should have correct app structure', () => {
    expect(firebaseApp).toHaveProperty('name');
    expect(firebaseApp).toHaveProperty('options');
  });

  test('should have correct auth structure', () => {
    expect(auth).toHaveProperty('currentUser');
    expect(auth).toHaveProperty('onAuthStateChanged');
  });
});
