import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase配置
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 获取认证实例
export const auth = getAuth(app);

export default app;