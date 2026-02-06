import { auth } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// 注册新用户
export const registerUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 这里可以添加用户信息到数据库
    console.log('用户注册成功:', user);
    return user;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

// 用户登录
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('用户登录成功:', user);
    return user;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 发送密码重置邮件
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('密码重置邮件已发送');
    return true;
  } catch (error) {
    console.error('发送密码重置邮件失败:', error);
    throw error;
  }
};

// 用户登出
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('用户登出成功');
    return true;
  } catch (error) {
    console.error('登出失败:', error);
    throw error;
  }
};

// 监听用户认证状态变化
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// 获取当前用户
export const getCurrentUser = () => {
  return auth.currentUser;
};