import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 模拟数据
const mockTransactions = [
  {
    id: '1',
    type: 'expense',
    amount: 100,
    category: '餐饮',
    description: '午餐',
    date: '2026-02-06',
    paymentMethod: '支付宝',
    platform: 'alipay'
  },
  {
    id: '2',
    type: 'expense',
    amount: 50,
    category: '交通',
    description: '打车',
    date: '2026-02-06',
    paymentMethod: '微信',
    platform: 'wechat'
  },
  {
    id: '3',
    type: 'income',
    amount: 5000,
    category: '工资',
    description: '2月工资',
    date: '2026-02-01',
    paymentMethod: '银行转账',
    platform: 'other'
  }
];

export default function TransactionsListScreen() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filter, setFilter] = useState('all'); // all, expense, income

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
          onPress: () => {
            setTransactions(transactions.filter(item => item.id !== id));
            Alert.alert('成功', '账单已删除');
          }
        }
      ]
    );
  };

  const filteredTransactions = transactions.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={[styles.amount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
          {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}
        </Text>
        <Text style={styles.platform}>
          {item.platform === 'alipay' ? '支付宝' : item.platform === 'wechat' ? '微信' : '其他'}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

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

      {/* 账单列表 */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无账单记录</Text>
          </View>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseAmount: {
    color: '#ff3b30',
  },
  incomeAmount: {
    color: '#34c759',
  },
  platform: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
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
  },
});