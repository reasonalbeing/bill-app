import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../hooks/useTransactions';
import { getCurrentUser } from '../../services/authService';

export default function TransactionsListScreen() {
  const [filter, setFilter] = useState('all'); // all, expense, income
  const [refreshing, setRefreshing] = useState(false);
  
  // 获取当前用户ID
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null; // 暂时使用固定ID，后续与Firebase用户关联
  
  // 使用自定义Hook获取账单数据
  const { 
    transactions, 
    loading, 
    error, 
    refresh, 
    deleteTransaction 
  } = useTransactions(userId, {
    type: filter === 'all' ? null : filter
  });

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 删除账单
  const handleDelete = (id) => {
    Alert.alert(
      '删除账单',
      '确定要删除这条账单吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTransaction(id);
            if (result.success) {
              Alert.alert('成功', '账单已删除');
            } else {
              Alert.alert('删除失败', result.error || '请稍后重试');
            }
          }
        }
      ]
    );
  };

  // 格式化金额显示
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 获取平台显示名称
  const getPlatformName = (platform) => {
    const platformMap = {
      'alipay': '支付宝',
      'wechat': '微信',
      'other': '其他'
    };
    return platformMap[platform] || '其他';
  };

  // 获取平台图标
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'alipay':
        return 'logo-alipay';
      case 'wechat':
        return 'logo-wechat';
      default:
        return 'card-outline';
    }
  };

  // 渲染账单项
  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: item.category_color || '#007AFF' }]}>
          <Ionicons 
            name={item.category_icon || 'pricetag'} 
            size={20} 
            color="#fff" 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.category}>{item.category_name || item.category || '未分类'}</Text>
          <Text style={styles.description} numberOfLines={1}>
            {item.description || '无描述'}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
            <View style={styles.platformTag}>
              <Ionicons 
                name={getPlatformIcon(item.platform)} 
                size={10} 
                color="#999" 
              />
              <Text style={styles.platformText}>{getPlatformName(item.platform)}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.amount, 
          item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
        ]}>
          {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
        </Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>暂无账单记录</Text>
      <Text style={styles.emptySubText}>点击底部"记账"按钮添加第一条记录</Text>
    </View>
  );

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

  return (
    <View style={styles.container}>
      {/* 过滤器 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            全部
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
          onPress={() => setFilter('expense')}
        >
          <Text style={[styles.filterButtonText, filter === 'expense' && styles.filterButtonTextActive]}>
            支出
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterButtonText, filter === 'income' && styles.filterButtonTextActive]}>
            收入
          </Text>
        </TouchableOpacity>
      </View>

      {/* 统计概览 */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>支出</Text>
          <Text style={styles.summaryExpense}>
            -{formatAmount(
              transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
            )}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>收入</Text>
          <Text style={styles.summaryIncome}>
            +{formatAmount(
              transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
            )}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>结余</Text>
          <Text style={styles.summaryBalance}>
            {formatAmount(
              transactions
                .reduce((sum, t) => sum + (t.type === 'income' ? 1 : -1) * parseFloat(t.amount), 0)
            )}
          </Text>
        </View>
      </View>

      {/* 账单列表 */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryExpense: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  summaryIncome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
  },
  summaryBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginRight: 8,
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseAmount: {
    color: '#ff3b30',
  },
  incomeAmount: {
    color: '#34c759',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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