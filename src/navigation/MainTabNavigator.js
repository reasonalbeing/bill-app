import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AddTransactionScreen from '../components/transactions/AddTransactionScreen';
import TransactionsListScreen from '../components/transactions/TransactionsListScreen';
import StatisticsScreen from '../components/statistics/StatisticsScreen';
import BudgetScreen from '../components/budget/BudgetScreen';
import SettingsScreen from '../components/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AddTransaction') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Budget') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen} 
        options={{ 
          title: '记账',
          headerTitle: '添加记账'
        }} 
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsListScreen} 
        options={{ 
          title: '账单',
          headerTitle: '账单列表'
        }} 
      />
      <Tab.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{ 
          title: '统计',
          headerTitle: '统计分析'
        }} 
      />
      <Tab.Screen 
        name="Budget" 
        component={BudgetScreen} 
        options={{ 
          title: '预算',
          headerTitle: '预算管理'
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: '设置',
          headerTitle: '设置'
        }} 
      />
    </Tab.Navigator>
  );
}