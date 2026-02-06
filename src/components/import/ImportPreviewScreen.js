import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';

export default function ImportPreviewScreen({ route, navigation }) {
  const { transactions, rawTransactions, fileName, billType } = route.params;
  const [selectedTransactions, setSelectedTransactions] = useState(
    new Set(transactions.map((_, index) => index))
  );
  const [isImporting, setIsImporting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingTransactionIndex, setEditingTransactionIndex] = useState(null);
  const [editedTransactions, setEditedTransactions] = useState(transactions);
  
  // 获取用户ID和hooks
  const userId = 1; // 暂时使用固定ID
  const { importTransactions } = useTransactions(userId);
  const { expenseCategories, incomeCategories } = useCategories(userId);

  // 切换选中状态
  const toggleSelection = (index) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTransactions.size === editedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(editedTransactions.map((_, index) => index)));
    }
  };

  // 修改交易分类
  const handleChangeCategory = (index, categoryId) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], category_id: categoryId };
    setEditedTransactions(updated);
    setShowCategoryModal(false);
  };

  // 删除交易
  const handleDeleteTransaction = (index) => {
    Alert.alert(
      '删除交易',
      '确定要删除这条交易记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const updated = editedTransactions.filter((_, i) => i !== index);
            setEditedTransactions(updated);
            // 更新选中状态
            const newSelected = new Set();
            selectedTransactions.forEach(i => {
              if (i < index) {
                newSelected.add(i);
              } else if (i > index) {
                newSelected.add(i - 1);
              }
            });
            setSelectedTransactions(newSelected);
          }
        }
      ]
    );
  };

  // 导入交易
  const handleImport = async () => {
    if (selectedTransactions.size === 0) {
      Alert.alert('提示', '请至少选择一条交易记录');
      return;
    }

    const transactionsToImport = editedTransactions.filter((_, index) => 
      selectedTransactions.has(index)
    );

    Alert.alert(
      '确认导入',
      `确定要导入 ${transactionsToImport.length} 条交易记录吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '导入',
          onPress: async () => {
            setIsImporting(true);
            const result = await importTransactions(transactionsToImport);
            setIsImporting(false);

            if (result.success) {
              Alert.alert(
                '导入成功',
                `成功导入 ${result.successCount || transactionsToImport.length} 条记录`,
                [
                  {
                    text: '确定',
                    onPress: () => navigation.navigate('Transactions')
                  }
                ]
              );
            } else {
              Alert.alert('导入失败', result.error || '请稍后重试');
            }
          }
        }
      ]
    );
  };

  // 获取分类名称
  const getCategoryName = (categoryId, type) => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '其他';
  };

  // 获取分类颜色
  const getCategoryColor = (categoryId, type) => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#999';
  };

  // 分类选择器模态框
  const CategoryPickerModal = () => {
    if (editingTransactionIndex === null) return null;
    
    const transaction = editedTransactions[editingTransactionIndex];
    const categories = transaction.type === 'income' ? incomeCategories : expenseCategories;

    return (
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
            
            <ScrollView>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleChangeCategory(editingTransactionIndex, category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color || '#007AFF' }]}>
                    <Ionicons name={category.icon || 'pricetag'} size={18} color="#fff" />
                  </View>
                  <Text style={styles.categoryItemText}>{category.name}</Text>
                  {transaction.category_id === category.id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // 渲染交易项
  const renderTransaction = ({ item, index }) => {
    const isSelected = selectedTransactions.has(index);
    const categoryName = getCategoryName(item.category_id, item.type);
    const categoryColor = getCategoryColor(item.category_id, item.type);

    return (
      <View style={[styles.transactionItem, isSelected && styles.transactionItemSelected]}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => toggleSelection(index)}
        >
          <Ionicons 
            name={isSelected ? "checkbox" : "square-outline"} 
            size={24} 
            color={isSelected ? "#007AFF" : "#ccc"} 
          />
        </TouchableOpacity>

        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={[
              styles.transactionAmount,
              item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.transactionMeta}>
            <Text style={styles.transactionDate}>{item.date}</Text>
            <TouchableOpacity 
              style={[styles.categoryTag, { backgroundColor: `${categoryColor}20` }]}
              onPress={() => {
                setEditingTransactionIndex(index);
                setShowCategoryModal(true);
              }}
            >
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryName}</Text>
              <Ionicons name="pencil" size={12} color={categoryColor} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteTransaction(index)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };

  // 计算统计
  const selectedCount = selectedTransactions.size;
  const selectedExpense = editedTransactions
    .filter((t, i) => selectedTransactions.has(i) && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const selectedIncome = editedTransactions
    .filter((t, i) => selectedTransactions.has(i) && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>导入预览</Text>
        <Text style={styles.headerSubtitle}>{fileName}</Text>
      </View>

      {/* 统计栏 */}
      <View style={styles.statsBar}>
        <TouchableOpacity 
          style={styles.selectAllButton}
          onPress={toggleSelectAll}
        >
          <Ionicons 
            name={selectedCount === editedTransactions.length ? "checkbox" : "square-outline"} 
            size={20} 
            color="#007AFF" 
          />
          <Text style={styles.selectAllText}>
            已选 {selectedCount}/{editedTransactions.length}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.statsRight}>
          <Text style={styles.statsExpense}>-{selectedExpense.toFixed(2)}</Text>
          <Text style={styles.statsIncome}>+{selectedIncome.toFixed(2)}</Text>
        </View>
      </View>

      {/* 交易列表 */}
      <FlatList
        data={editedTransactions}
        renderItem={renderTransaction}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>没有可导入的交易</Text>
          </View>
        }
      />

      {/* 底部导入按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.importButton, selectedCount === 0 && styles.importButtonDisabled]}
          onPress={handleImport}
          disabled={selectedCount === 0 || isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.importButtonText}>
                导入 {selectedCount} 条记录
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 分类选择器模态框 */}
      <CategoryPickerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsExpense: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
    marginRight: 12,
  },
  statsIncome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34c759',
  },
  listContent: {
    paddingVertical: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionItemSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionDescription: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginRight: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseAmount: {
    color: '#ff3b30',
  },
  incomeAmount: {
    color: '#34c759',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 12,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  importButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
});
