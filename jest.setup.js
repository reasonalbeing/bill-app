// Jest setup file for global mocks

// Mock fetch and other browser globals for Node.js environment
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({})
}));

global.Response = jest.fn(() => ({
  ok: true,
  json: () => Promise.resolve({})
}));

global.Headers = jest.fn();
global.Request = jest.fn();

// Mock other browser APIs if needed
global.document = {
  createElement: jest.fn(),
  createEvent: jest.fn(),
  querySelector: jest.fn(),
  body: {}
};

global.navigator = {
  userAgent: 'Node.js'
};

// Mock React Native modules
global.React = require('react');

// Mock __fbBatchedBridgeConfig for native modules
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// Mock NativeModules
global.NativeModules = {
  ...global.NativeModules,
  PlatformConstants: {
    reactNativeVersion: {
      major: 0,
      minor: 76,
      patch: 6,
      prerelease: null,
    },
  },
  DeviceInfo: {
    getDeviceId: jest.fn(() => 'test-device-id'),
    getDeviceName: jest.fn(() => 'Test Device'),
    getSystemName: jest.fn(() => 'iOS'),
    getSystemVersion: jest.fn(() => '14.0'),
  },
};

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 375,
    height: 812,
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock PixelRatio
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  get: jest.fn(() => 2),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn(size => size * 2),
  roundToNearestPixel: jest.fn(value => Math.round(value)),
}));

// Mock BatchedBridge
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => {
  // Set __fbBatchedBridgeConfig before requiring the actual module
  global.__fbBatchedBridgeConfig = {
    remoteModuleConfig: [],
    localModulesConfig: [],
  };
  
  return {
    ...global.NativeModules,
  };
});

// Mock TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => null),
  get: jest.fn(() => null),
  register: jest.fn(),
}));

// Mock React Native specific APIs
jest.mock('react-native', () => {
  const React = require('react');
  return {
    Platform: {
      OS: 'ios',
      Version: 14,
      select: jest.fn(obj => obj.ios || obj.default),
      isTV: jest.fn(() => false),
      isTesting: true,
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn(size => size * 2),
      roundToNearestPixel: jest.fn(value => Math.round(value)),
    },
    NativeModules: {
      PlatformConstants: {
        reactNativeVersion: {
          major: 0,
          minor: 76,
          patch: 6,
          prerelease: null,
        },
      },
      DeviceInfo: {
        getDeviceId: jest.fn(() => 'test-device-id'),
        getDeviceName: jest.fn(() => 'Test Device'),
        getSystemName: jest.fn(() => 'iOS'),
        getSystemVersion: jest.fn(() => '14.0'),
      },
    },
    StyleSheet: {
      create: jest.fn(obj => obj),
      flatten: jest.fn(),
      hairlineWidth: 1,
    },
    Text: ({ children, ...props }) => React.createElement('Text', props, children),
    View: ({ children, ...props }) => React.createElement('View', props, children),
    TouchableOpacity: ({ children, ...props }) => React.createElement('TouchableOpacity', props, children),
    ScrollView: ({ children, ...props }) => React.createElement('ScrollView', props, children),
    TextInput: ({ children, ...props }) => React.createElement('TextInput', props, children),
    Image: ({ children, ...props }) => React.createElement('Image', props, children),
    SafeAreaView: ({ children, ...props }) => React.createElement('SafeAreaView', props, children),
    FlatList: ({ children, ...props }) => React.createElement('FlatList', props, children),
    Modal: ({ children, ...props }) => React.createElement('Modal', props, children),
    Alert: {
      alert: jest.fn(),
    },
    KeyboardAvoidingView: ({ children, ...props }) => React.createElement('KeyboardAvoidingView', props, children),
  };
});

// Mock StyleSheet processColor
jest.mock('react-native/Libraries/StyleSheet/processColor', () => ({
  default: jest.fn(color => color),
}));

// Mock StyleSheet processBackgroundImage
jest.mock('react-native/Libraries/StyleSheet/processBackgroundImage', () => ({
  default: jest.fn(),
}));

// Mock ReactNativeStyleAttributes
jest.mock('react-native/Libraries/Components/View/ReactNativeStyleAttributes', () => ({
  default: {},
}));

// Mock NativeDeviceInfo
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  getDeviceId: jest.fn(() => 'test-device-id'),
  getDeviceName: jest.fn(() => 'Test Device'),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '14.0'),
}));

// Mock NativePlatformConstantsIOS
jest.mock('react-native/src/private/specs/modules/NativePlatformConstantsIOS', () => ({
  default: {
    reactNativeVersion: {
      major: 0,
      minor: 76,
      patch: 6,
      prerelease: null,
    },
  },
}));

// Mock NativeDeviceInfo
jest.mock('react-native/src/private/specs/modules/NativeDeviceInfo', () => ({
  default: {
    deviceId: 'test-device-id',
    deviceName: 'Test Device',
    systemName: 'iOS',
    systemVersion: '14.0',
  },
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: 14,
  select: jest.fn(obj => obj.ios || obj.default),
  isTV: jest.fn(() => false),
  isTesting: true,
  constants: {
    reactNativeVersion: {
      major: 0,
      minor: 76,
      patch: 6,
      prerelease: null,
    },
  },
}));

// Mock Expo modules
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    transaction: jest.fn(callback => {
      callback({
        executeSql: jest.fn((sql, params, success, error) => {
          success({}, {
            rows: {
              _array: [],
              length: 0,
            },
          });
        }),
      });
    }),
  })),
}));

// Mock other Expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: '/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ cancelled: true })),
}));

// Mock Firebase modules
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  app: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(() => Promise.resolve()),
      get: jest.fn(() => Promise.resolve({ exists: false })),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    })),
    get: jest.fn(() => Promise.resolve({ docs: [] })),
  })),
}));
