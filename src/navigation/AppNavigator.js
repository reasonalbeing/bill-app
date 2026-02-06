import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../components/auth/LoginScreen';
import RegisterScreen from '../components/auth/RegisterScreen';
import ResetPasswordScreen from '../components/auth/ResetPasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import ImportScreen from '../components/import/ImportScreen';
import ImportPreviewScreen from '../components/import/ImportPreviewScreen';
import AIConfigScreen from '../components/settings/AIConfigScreen';
import AIChatScreen from '../components/ai/AIChatScreen';
import BackupScreen from '../components/settings/BackupScreen';
import TransactionDetailScreen from '../components/transactions/TransactionDetailScreen';
import AdvancedFilterScreen from '../components/statistics/AdvancedFilterScreen';
import CustomBudgetRulesScreen from '../components/budget/CustomBudgetRulesScreen';
import StatisticsRulesScreen from '../components/settings/StatisticsRulesScreen';
import OCRScreen from '../components/ocr/OCRScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen 
          name="Import" 
          component={ImportScreen} 
          options={{ headerShown: true, headerTitle: '导入账单' }}
        />
        <Stack.Screen 
          name="ImportPreview" 
          component={ImportPreviewScreen} 
          options={{ headerShown: true, headerTitle: '导入预览' }}
        />
        <Stack.Screen 
          name="AIConfig" 
          component={AIConfigScreen} 
          options={{ headerShown: true, headerTitle: 'AI服务配置' }}
        />
        <Stack.Screen 
          name="AIChat" 
          component={AIChatScreen} 
          options={{ headerShown: true, headerTitle: 'AI记账助手' }}
        />
        <Stack.Screen 
          name="Backup" 
          component={BackupScreen} 
          options={{ headerShown: true, headerTitle: '备份与恢复' }}
        />
        <Stack.Screen 
          name="TransactionDetail" 
          component={TransactionDetailScreen} 
          options={{ headerShown: true, headerTitle: '交易详情' }}
        />
        <Stack.Screen 
          name="AdvancedFilter" 
          component={AdvancedFilterScreen} 
          options={{ headerShown: true, headerTitle: '高级筛选' }}
        />
        <Stack.Screen 
          name="CustomBudgetRules" 
          component={CustomBudgetRulesScreen} 
          options={{ headerShown: true, headerTitle: '自定义预算规则' }}
        />
        <Stack.Screen 
          name="StatisticsRules" 
          component={StatisticsRulesScreen} 
          options={{ headerShown: true, headerTitle: '统计规则设置' }}
        />
        <Stack.Screen 
          name="OCR" 
          component={OCRScreen} 
          options={{ headerShown: true, headerTitle: 'OCR识别' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
