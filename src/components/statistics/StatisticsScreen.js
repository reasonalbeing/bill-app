import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 模拟统计数据
const mockStatistics = {
  totalIncome: 5000,
  totalExpense: 150,
  balance: 4850,
  categories: [
    { name: '餐饮', amount: 100, percentage: 66.67 },
    { name: '交通', amount: 50, percentage: 33.33 }
  ],
  dailyData: [
    { date: '2026-02-01', expense: 0, income: 5000 },
    { date: '2026-02-02', expense: 0, income: 0 },
    { date: '2026-02-03', expense: 0, income: 0 },
    { date: '2026-02-04', expense: 0, income: 0 },
    { date: '2026-02-05', expense: 0, income: 0 },
    { date: '2026-02-06', expense: 150, income: 0 }
  ]
};

export default function StatisticsScreen() {
  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year

  return (
    <ScrollView style={styles.container}>
      {/* 时间范围选择器 */}
      <View style={styles.timeRangeSelector}>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'day' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('day')}
        >
          <Text style={[styles.timeRangeButtonText, timeRange === 'day' && styles.timeRangeButtonTextActive]}>
            日
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('week')}
        >
          <Text style={[styles.timeRangeButtonText, timeRange === 'week' && styles.timeRangeButtonTextActive]}>
            周
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.timeRangeButtonText, timeRange === 'month' && styles.timeRangeButtonTextActive]}>
            月
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'year' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('year')}
        >
          <Text style={[styles.timeRangeButtonText, timeRange === 'year' && styles.timeRangeButtonTextActive]}>
            年
          </Text>
        </TouchableOpacity>
      </View>

      {/* 总览卡片 */}
      <View style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>收支总览</Text>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>总收入</Text>
            <Text style={styles.incomeAmount}>+{mockStatistics.totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>总支出</Text>
            <Text style={styles.expenseAmount}>-{mockStatistics.totalExpense.toFixed(2)}</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>结余</Text>
            <Text style={styles.balanceAmount}>{mockStatistics.balance.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* 分类统计 */}
      <View style={styles.categoryCard}>
        <Text style={styles.sectionTitle}>分类统计</Text>
        {mockStatistics.categories.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryPercentage}>{category.percentage.toFixed(2)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${category.percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.categoryAmount}>-{category.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* 每日收支趋势 */}
      <View style={styles.trendCard}>
        <Text style={styles.sectionTitle}>每日收支趋势</Text>
        <View style={styles.trendContainer}>
          {mockStatistics.dailyData.map((item, index) => (
            <View key={index} style={styles.trendItem}>
              <Text style={styles.trendDate}>{item.date.split('-')[2]}</Text>
              <View style={styles.trendBars}>
                {item.income > 0 && (
                  <View 
                    style={[
                      styles.incomeBar, 
                      { height: `${Math.min(item.income / 100, 100)}%` }
                    ]} 
                  />
                )}
                {item.expense > 0 && (
                  <View 
                    style={[
                      styles.expenseBar, 
                      { height: `${Math.min(item.expense / 10, 100)}%` }
                    ]} 
                  />
                )}
              </View>
              <Text style={styles.trendAmount}>
                {item.income > 0 ? '+' : ''}{(item.income - item.expense).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 平台统计 */}
      <View style={styles.platformCard}>
        <Text style={styles.sectionTitle}>平台统计</Text>
        <View style={styles.platformItem}>
          <View style={styles.platformInfo}>
            <Ionicons name="logo-alipay" size={24} color="#1677FF" />
            <Text style={styles.platformName}>支付宝</Text>
          </View>
          <Text style={styles.platformAmount}>-100.00</Text>
        </View>
        <View style={styles.platformItem}>
          <View style={styles.platformInfo}>
            <Ionicons name="logo-wechat" size={24} color="#07C160" />
            <Text style={styles.platformName}>微信</Text>
          </View>
          <Text style={styles.platformAmount}>-50.00</Text>
        </View>
        <View style={styles.platformItem}>
          <View style={styles.platformInfo}>
            <Ionicons name="card-outline" size={24} color="#8E8E93" />
            <Text style={styles.platformName}>其他</Text>
          </View>
          <Text style={styles.platformAmount}>0.00</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  timeRangeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  overviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34c759',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  categoryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  categoryItem: {
    marginBottom: 15,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'right',
  },
  trendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  trendBars: {
    width: 30,
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  incomeBar: {
    width: '100%',
    backgroundColor: '#34c759',
    borderRadius: 4,
    marginBottom: 2,
  },
  expenseBar: {
    width: '100%',
    backgroundColor: '#ff3b30',
    borderRadius: 4,
  },
  trendAmount: {
    fontSize: 12,
    color: '#333',
  },
  platformCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  platformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  platformAmount: {
    fontSize: 14,
    color: '#ff3b30',
  },
});