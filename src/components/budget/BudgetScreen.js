import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { getCurrentUser } from '../../services/authService';

export default function BudgetScreen() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newBudget, setNewBudget] = useState({
    amount: '',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    recurring: 'none',
    description: ''
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // 获取当前用户ID
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  
  // 使用自定义Hooks
  const { 
    budgets, 
    loading, 
    error, 
    refresh, 
    refreshSpending,
    createBudget, 
    deleteBudget 
  } = useBudgets(userId);
  
  const { expenseCategories, loading: categoriesLoading } = useCategories(userId);

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSpending();
    setRefreshing(false);
  };

  // 添加预算
  const handleAddBudget = async () => {
    if (!newBudget.amount || parseFloat(newBudget.amount) <= 0) {
      Alert.alert('提示', '请输入有效的预算金额');
      return;
    }

    const budgetData = {
      amount: parseFloat(newBudget.amount),
      category_id: newBudget.categoryId || null,
      start_date: newBudget.startDate,
      end_date: newBudget.endDate,
      recurring: newBudget.recurring,
      description: newBudget.description.trim(),
    };

    const result = await createBudget(budgetData);
    
    if (result.success) {
      Alert.alert('成功', '预算已添加');
      setShowAddForm(false);
      resetForm();
    } else {
      Alert.alert('添加失败', result.error || '请稍后重试');
    }
  };

  // 删除预算
  const handleDeleteBudget = (id) => {
    Alert.alert(
      '删除预算',
      '确定要删除这条预算吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteBudget(id);
            if (result.success) {
              Alert.alert('成功', '预算已删除');
            } else {
              Alert.alert('删除失败', result.error || '请稍后重试');
            }
          }
        }
      ]
    );
  };

  // 重置表单
  const resetForm = () => {
    setNewBudget({
      amount: '',
      categoryId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      recurring: 'none',
      description: ''
    });
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // 获取重复类型文本
  const getRecurringText = (recurring) => {
    const map = {
      'none': '不重复',
      'monthly': '每月重复',
      'yearly': '每年重复'
    };
    return map[recurring] || '不重复';
  };

  // 获取选中的分类信息
  const selectedCategory = expenseCategories.find(c => c.id === newBudget.categoryId);

  // 分类选择器模态框
  const CategoryPickerModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择分类</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.categoryItem, !newBudget.categoryId && styles.categoryItemActive]}
            onPress={() => {
              setNewBudget({ ...newBudget, categoryId: '' });
              setShowCategoryModal(false);
            }}
          >
            <View style={[styles.categoryIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="wallet" size={20} color="#fff" />
            </View>
            <Text style={[styles.categoryItemText, !newBudget.categoryId && styles.categoryItemTextActive]}>
              总预算（所有支出）
            </Text>
            {!newBudget.categoryId && <Ionicons name="checkmark" size={20} color="#007AFF" />}
          </TouchableOpacity>
          
          {categoriesLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.modalLoading} />
          ) : (
            expenseCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryItem, newBudget.categoryId === category.id && styles.categoryItemActive]}
                onPress={() => {
                  setNewBudget({ ...newBudget, categoryId: category.id });
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color || '#007AFF' }]}>
                  <Ionicons name={category.icon || 'pricetag'} size={20} color="#fff" />
                </View>
                <Text style={[styles.categoryItemText, newBudget.categoryId === category.id && styles.categoryItemTextActive]}>
                  {category.name}
                </Text>
                {newBudget.categoryId === category.id && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </Modal>
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
      {/* 添加预算按钮 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Ionicons name={showAddForm ? "close-circle-outline" : "add-circle-outline"} size={24} color="#007AFF" />
        <Text style={styles.addButtonText}>{showAddForm ? '取消添加' : '添加预算'}</Text>
      </TouchableOpacity>

      {/* 添加预算表单 */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>新建预算</Text>
          
          {/* 预算金额 */}
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>预算金额</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.amountInput}
                value={newBudget.amount}
                onChangeText={(text) => setNewBudget({ ...newBudget, amount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          {/* 分类选择 */}
          <TouchableOpacity 
            style={styles.formItem}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.formLabel}>预算分类</Text>
            <View style={styles.selectorRow}>
              {selectedCategory ? (
                <View style={styles.selectedCategory}>
                  <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color || '#007AFF' }]}>
                    <Ionicons name={selectedCategory.icon || 'pricetag'} size={14} color="#fff" />
                  </View>
                  <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>总预算（所有支出）</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>

          {/* 重复类型 */}
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>重复类型</Text>
            <View style={styles.recurringSelector}>
              {['none', 'monthly', 'yearly'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.recurringButton, newBudget.recurring === type && styles.recurringButtonActive]}
                  onPress={() => setNewBudget({ ...newBudget, recurring: type })}
                >
                  <Text style={[styles.recurringButtonText, newBudget.recurring === type && styles.recurringButtonTextActive]}>
                    {type === 'none' ? '不重复' : type === 'monthly' ? '每月' : '每年'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 描述 */}
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>备注（选填）</Text>
            <TextInput
              style={styles.formInput}
              value={newBudget.description}
              onChangeText={(text) => setNewBudget({ ...newBudget, description: text })}
              placeholder="添加备注..."
              placeholderTextColor="#ccc"
            />
          </View>

          {/* 保存按钮 */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleAddBudget}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>保存预算</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 预算列表 */}
      {budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>暂无预算</Text>
          <Text style={styles.emptySubText}>添加预算来跟踪您的支出</Text>
        </View>
      ) : (
        budgets.map((budget) => (
          <View key={budget.id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetLeft}>
                {budget.category_id ? (
                  <View style={[styles.budgetIcon, { backgroundColor: budget.category_color || '#007AFF' }]}>
                    <Ionicons name={budget.category_icon || 'pricetag'} size={18} color="#fff" />
                  </View>
                ) : (
                  <View style={[styles.budgetIcon, { backgroundColor: '#007AFF' }]}>
                    <Ionicons name="wallet" size={18} color="#fff" />
                  </View>
                )}
                <View>
                  <Text style={styles.budgetCategory}>
                    {budget.category_name || '总预算'}
                  </Text>
                  <Text style={styles.budgetRecurring}>{getRecurringText(budget.recurring)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteBudget(budget.id)}>
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>

            <View style={styles.budgetAmounts}>
              <View style={styles.budgetAmountItem}>
                <Text style={styles.budgetAmountLabel}>预算</Text>
                <Text style={styles.budgetAmountValue}>¥{formatAmount(budget.amount)}</Text>
              </View>
              <View style={styles.budgetAmountItem}>
                <Text style={styles.budgetAmountLabel}>已用</Text>
                <Text style={[styles.budgetAmountValue, styles.spentAmount]}>
                  ¥{formatAmount(budget.spent)}
                </Text>
              </View>
              <View style={styles.budgetAmountItem}>
                <Text style={styles.budgetAmountLabel}>剩余</Text>
                <Text style={[styles.budgetAmountValue, budget.isOverBudget ? styles.overBudgetAmount : styles.remainingAmount]}>
                  ¥{formatAmount(budget.remaining)}
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(budget.percentage, 100)}%`,
                      backgroundColor: budget.isOverBudget ? '#ff3b30' : budget.percentage > 80 ? '#ff9500' : '#34c759'
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  {budget.isOverBudget ? '已超支' : `${Math.round(budget.percentage)}% 已使用`}
                </Text>
                {budget.isOverBudget && (
                  <Text style={styles.overBudgetText}>
                    超支 ¥{formatAmount(Math.abs(budget.remaining - parseFloat(budget.amount)))}
                  </Text>
                )}
              </View>
            </View>

            {budget.description ? (
              <Text style={styles.budgetDescription}>{budget.description}</Text>
            ) : null}
          </View>
        ))
      )}

      {/* 分类选择器模态框 */}
      <CategoryPickerModal />
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  addForm: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#333',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    paddingVertical: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedCategoryText: {
    fontSize: 15,
    color: '#333',
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  recurringSelector: {
    flexDirection: 'row',
  },
  recurringButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  recurringButtonActive: {
    backgroundColor: '#007AFF',
  },
  recurringButtonText: {
    fontSize: 14,
    color: '#666',
  },
  recurringButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
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
  budgetCard: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  budgetRecurring: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetAmountItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetAmountLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  budgetAmountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  spentAmount: {
    color: '#ff3b30',
  },
  remainingAmount: {
    color: '#34c759',
  },
  overBudgetAmount: {
    color: '#ff3b30',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  overBudgetText: {
    fontSize: 12,
    color: '#ff3b30',
    fontWeight: '600',
  },
  budgetDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalLoading: {
    paddingVertical: 40,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemActive: {
    backgroundColor: '#f0f8ff',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoryItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
