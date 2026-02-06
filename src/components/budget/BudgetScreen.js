import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 模拟预算数据
const mockBudgets = [
  {
    id: '1',
    amount: 2000,
    category: '总预算',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    recurring: 'monthly',
    spent: 150,
    remaining: 1850
  },
  {
    id: '2',
    amount: 800,
    category: '餐饮',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    recurring: 'monthly',
    spent: 100,
    remaining: 700
  },
  {
    id: '3',
    amount: 300,
    category: '交通',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    recurring: 'monthly',
    spent: 50,
    remaining: 250
  }
];

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    amount: '',
    category: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    recurring: 'monthly'
  });

  const handleAddBudget = () => {
    if (!newBudget.amount || !newBudget.category) {
      Alert.alert('提示', '请填写预算金额和分类');
      return;
    }

    // 这里可以添加保存预算的逻辑
    Alert.alert('成功', '预算已添加');
    setShowAddForm(false);
    setNewBudget({
      amount: '',
      category: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      recurring: 'monthly'
    });
  };

  const handleDeleteBudget = (id) => {
    Alert.alert(
      '删除预算',
      '确定要删除这条预算吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setBudgets(budgets.filter(item => item.id !== id));
            Alert.alert('成功', '预算已删除');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 添加预算按钮 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.addButtonText}>添加预算</Text>
      </TouchableOpacity>

      {/* 添加预算表单 */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>添加预算</Text>
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>预算金额</Text>
            <TextInput
              style={styles.formInput}
              value={newBudget.amount}
              onChangeText={(text) => setNewBudget({ ...newBudget, amount: text })}
              placeholder="请输入预算金额"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>预算分类</Text>
            <TextInput
              style={styles.formInput}
              value={newBudget.category}
              onChangeText={(text) => setNewBudget({ ...newBudget, category: text })}
              placeholder="请输入预算分类"
            />
          </View>
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>开始日期</Text>
            <TextInput
              style={styles.formInput}
              value={newBudget.startDate}
              onChangeText={(text) => setNewBudget({ ...newBudget, startDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>结束日期</Text>
            <TextInput
              style={styles.formInput}
              value={newBudget.endDate}
              onChangeText={(text) => setNewBudget({ ...newBudget, endDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>重复类型</Text>
            <View style={styles.recurringSelector}>
              <TouchableOpacity
                style={[styles.recurringButton, newBudget.recurring === 'none' && styles.recurringButtonActive]}
                onPress={() => setNewBudget({ ...newBudget, recurring: 'none' })}
              >
                <Text style={[styles.recurringButtonText, newBudget.recurring === 'none' && styles.recurringButtonTextActive]}>
                  不重复
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recurringButton, newBudget.recurring === 'monthly' && styles.recurringButtonActive]}
                onPress={() => setNewBudget({ ...newBudget, recurring: 'monthly' })}
              >
                <Text style={[styles.recurringButtonText, newBudget.recurring === 'monthly' && styles.recurringButtonTextActive]}>
                  每月
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recurringButton, newBudget.recurring === 'yearly' && styles.recurringButtonActive]}
                onPress={() => setNewBudget({ ...newBudget, recurring: 'yearly' })}
              >
                <Text style={[styles.recurringButtonText, newBudget.recurring === 'yearly' && styles.recurringButtonTextActive]}>
                  每年
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.saveButton]}
              onPress={handleAddBudget}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 预算列表 */}
      {budgets.map((budget) => (
        <View key={budget.id} style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetCategory}>{budget.category}</Text>
            <TouchableOpacity onPress={() => handleDeleteBudget(budget.id)}>
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
          <View style={styles.budgetAmounts}>
            <View style={styles.budgetAmountItem}>
              <Text style={styles.budgetAmountLabel}>预算金额</Text>
              <Text style={styles.budgetAmountValue}>{budget.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.budgetAmountItem}>
              <Text style={styles.budgetAmountLabel}>已花费</Text>
              <Text style={styles.spentAmount}>{budget.spent.toFixed(2)}</Text>
            </View>
            <View style={styles.budgetAmountItem}>
              <Text style={styles.budgetAmountLabel}>剩余</Text>
              <Text style={styles.remainingAmount}>{budget.remaining.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.budgetProgress}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${(budget.spent / budget.amount) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((budget.spent / budget.amount) * 100)}% 已使用
            </Text>
          </View>
          <View style={styles.budgetFooter}>
            <Text style={styles.budgetDate}>
              {budget.startDate} 至 {budget.endDate}
            </Text>
            <Text style={styles.budgetRecurring}>
              {budget.recurring === 'monthly' ? '每月重复' : budget.recurring === 'yearly' ? '每年重复' : '不重复'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 10,
  },
  addForm: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  formItem: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  recurringSelector: {
    flexDirection: 'row',
  },
  recurringButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  recurringButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recurringButtonText: {
    fontSize: 14,
    color: '#333',
  },
  recurringButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  budgetAmountItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetAmountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  budgetAmountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
  },
  budgetProgress: {
    marginBottom: 15,
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
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDate: {
    fontSize: 12,
    color: '#999',
  },
  budgetRecurring: {
    fontSize: 12,
    color: '#999',
  },
});