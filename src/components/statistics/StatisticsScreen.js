import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../hooks/useTransactions';
import { getCurrentUser } from '../../services/authService';

export default function StatisticsScreen() {
  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year
  const [refreshing, setRefreshing] = useState(false);
  
  // 获取当前用户ID
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  
  // 计算日期范围
  const getDateRange = () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate;
    
    switch (timeRange) {
      case 'day':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      default:
        startDate = endDate;
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // 使用自定义Hook获取统计数据
  const { 
    transactions,
    statistics, 
    loading, 
    error, 
    refresh,
    loadStatistics 
  } = useTransactions(userId, { startDate, endDate });

  // 加载统计数据
  useEffect(() => {
    if (userId) {
      loadStatistics({ startDate, endDate });
    }
  }, [userId, timeRange, startDate, endDate]);

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await loadStatistics({ startDate, endDate });
    setRefreshing(false);
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // 计算分类统计数据
  const categoryStats = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const stats = {};
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryName = t.category_name || t.category || '未分类';
        const categoryColor = t.category_color || '#007AFF';
        const categoryIcon = t.category_icon || 'pricetag';
        
        if (!stats[categoryName]) {
          stats[categoryName] = {
            name: categoryName,
            amount: 0,
            color: categoryColor,
            icon: categoryIcon,
          };
        }
        stats[categoryName].amount += parseFloat(t.amount);
      });
    
    return Object.values(stats)
      .map(s => ({
        ...s,
        percentage: totalExpense > 0 ? (s.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // 计算每日统计数据
  const dailyStats = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const stats = {};
    const dates = [];
    
    // 生成日期范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
      stats[dateStr] = { date: dateStr, income: 0, expense: 0 };
    }
    
    // 填充数据
    transactions.forEach(t => {
      if (stats[t.date]) {
        if (t.type === 'income') {
          stats[t.date].income += parseFloat(t.amount);
        } else {
          stats[t.date].expense += parseFloat(t.amount);
        }
      }
    });
    
    return dates.map(date => stats[date]);
  }, [transactions, startDate, endDate]);

  // 计算平台统计数据
  const platformStats = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const stats = {};
    const platformConfig = {
      alipay: { name: '支付宝', icon: 'logo-alipay', color: '#1677FF' },
      wechat: { name: '微信', icon: 'logo-wechat', color: '#07C160' },
      other: { name: '其他', icon: 'card-outline', color: '#8E8E93' },
    };
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const platform = t.platform || 'other';
        if (!stats[platform]) {
          stats[platform] = {
            platform,
            ...platformConfig[platform],
            amount: 0,
            count: 0,
          };
        }
        stats[platform].amount += parseFloat(t.amount);
        stats[platform].count += 1;
      });
    
    return Object.values(stats).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // 获取时间范围显示文本
  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'day':
        return '今日';
      case 'week':
        return '近7天';
      case 'month':
        return '近30天';
      case 'year':
        return '近一年';
      default:
        return '';
    }
  };

  // 渲染加载状态
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff3b30" />
        <Text style={styles.errorText}>加载失败</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalIncome = statistics?.totalIncome || 0;
  const totalExpense = statistics?.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007AFF']}
        />
      }
    >
      {/* 时间范围选择器 */}
      <View style={styles.timeRangeSelector}>
        {['day', 'week', 'month', 'year'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeRangeButtonText, timeRange === range && styles.timeRangeButtonTextActive]}>
              {range === 'day' ? '日' : range === 'week' ? '周' : range === 'month' ? '月' : '年'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 总览卡片 */}
      <View style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>{getTimeRangeText()}收支总览</Text>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>总收入</Text>
            <Text style={styles.incomeAmount}>+{formatAmount(totalIncome)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>总支出</Text>
            <Text style={styles.expenseAmount}>-{formatAmount(totalExpense)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>结余</Text>
            <Text style={[styles.balanceAmount, balance >= 0 ? styles.incomeText : styles.expenseText]}>
              {balance >= 0 ? '+' : ''}{formatAmount(balance)}
            </Text>
          </View>
        </View>
      </View>

      {/* 分类统计 */}
      {categoryStats.length > 0 && (
        <View style={styles.categoryCard}>
          <Text style={styles.sectionTitle}>支出分类</Text>
          {categoryStats.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon} size={16} color="#fff" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>-{formatAmount(category.amount)}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(category.percentage, 100)}%`, backgroundColor: category.color }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 每日收支趋势 */}
      {dailyStats.length > 0 && (
        <View style={styles.trendCard}>
          <Text style={styles.sectionTitle}>收支趋势</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.trendContainer}>
              {dailyStats.map((item, index) => {
                const maxAmount = Math.max(
                  ...dailyStats.map(d => Math.max(d.income, d.expense)),
                  1
                );
                const incomeHeight = maxAmount > 0 ? (item.income / maxAmount) * 80 : 0;
                const expenseHeight = maxAmount > 0 ? (item.expense / maxAmount) * 80 : 0;
                
                return (
                  <View key={index} style={styles.trendItem}>
                    <View style={styles.trendBars}>
                      {incomeHeight > 0 && (
                        <View style={[styles.incomeBar, { height: incomeHeight }]} />
                      )}
                      {expenseHeight > 0 && (
                        <View style={[styles.expenseBar, { height: expenseHeight }]} />
                      )}
                    </View>
                    <Text style={styles.trendDate}>
                      {item.date.split('-')[1]}/{item.date.split('-')[2]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34c759' }]} />
              <Text style={styles.legendText}>收入</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff3b30' }]} />
              <Text style={styles.legendText}>支出</Text>
            </View>
          </View>
        </View>
      )}

      {/* 平台统计 */}
      {platformStats.length > 0 && (
        <View style={styles.platformCard}>
          <Text style={styles.sectionTitle}>支付平台</Text>
          {platformStats.map((platform, index) => (
            <View key={index} style={styles.platformItem}>
              <View style={styles.platformInfo}>
                <View style={[styles.platformIcon, { backgroundColor: `${platform.color}20` }]}>
                  <Ionicons name={platform.icon} size={20} color={platform.color} />
                </View>
                <View>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  <Text style={styles.platformCount}>{platform.count}笔</Text>
                </View>
              </View>
              <Text style={styles.platformAmount}>-{formatAmount(platform.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 空状态 */}
      {transactions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>暂无统计数据</Text>
          <Text style={styles.emptySubText}>添加账单后将显示统计分析</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  overviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  overviewLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
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
  },
  incomeText: {
    color: '#34c759',
  },
  expenseText: {
    color: '#ff3b30',
  },
  categoryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff3b30',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  trendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  trendItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 30,
  },
  trendBars: {
    width: 24,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  incomeBar: {
    width: 10,
    backgroundColor: '#34c759',
    borderRadius: 2,
    marginRight: 2,
  },
  expenseBar: {
    width: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 2,
  },
  trendDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 6,
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
  platformCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  platformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  platformCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  platformAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff3b30',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 8,
  },
});