import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { getCurrentUser } from '../../services/authService';

export default function TransactionDetailScreen({ route, navigation }) {
  const { transaction, isNew = false } = route.params || {};
  const [isEditing, setIsEditing] = useState(isNew);
  const [isLoading, setIsLoading] = useState(false);
  
  // 表单状态
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [type, setType] = useState(transaction?.type || 'expense');
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description || '');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [tags, setTags] = useState(transaction?.tags ? JSON.parse(transaction.tags) : []);
  const [location, setLocation] = useState(transaction?.location || '');
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || 'other');
  const [platform, setPlatform] = useState(transaction?.platform || 'other');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  // 获取用户和hooks
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  const { updateTransaction, createTransaction } = useTransactions(userId);
  const { categories, expenseCategories, incomeCategories } = useCategories(userId);

  // 获取当前分类
  const currentCategory = categories.find(c => c.id === categoryId);
  const availableCategories = type === 'expense' ? expenseCategories : incomeCategories;

  // 保存交易
  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }

    setIsLoading(true);
    
    const transactionData = {
      amount: parseFloat(amount),
      type,
      category_id: categoryId || null,
      date,
      description: description.trim(),
      notes: notes.trim(),
      tags: JSON.stringify(tags),
      location: location.trim(),
      payment_method: paymentMethod,
      platform,
    };

    let result;
    if (isNew) {
      result = await createTransaction(transactionData);
    } else {
      result = await updateTransaction(transaction.id, transactionData);
    }

    setIsLoading(false);

    if (result.success) {
      Alert.alert('成功', isNew ? '交易已创建' : '交易已更新', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('失败', result.error || '操作失败，请重试');
    }
  };

  // 删除交易
  const handleDelete = () => {
    Alert.alert(
      '删除交易',
      '确定要删除这条交易记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            // 这里需要添加删除逻辑
            navigation.goBack();
          }
        }
      ]
    );
  };

  // 添加标签
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim())) {
      Alert.alert('提示', '该标签已存在');
      return;
    }
    if (tags.length >= 5) {
      Alert.alert('提示', '最多只能添加5个标签');
      return;
    }
    setTags([...tags, newTag.trim()]);
    setNewTag('');
    setShowTagInput(false);
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 分类选择模态框
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
          
          <ScrollView>
            {availableCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  categoryId === category.id && styles.categoryItemActive
                ]}
                onPress={() => {
                  setCategoryId(category.id);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color || '#007AFF' }]}>
                  <Ionicons name={category.icon || 'pricetag'} size={20} color="#fff" />
                </View>
                <Text style={[
                  styles.categoryItemText,
                  categoryId === category.id && styles.categoryItemTextActive
                ]}>
                  {category.name}
                </Text>
                {categoryId === category.id && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 金额输入 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>金额</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>¥</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#ccc"
            editable={isEditing}
          />
        </View>
      </View>

      {/* 类型选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>类型</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => {
              setType('expense');
              setCategoryId('');
            }}
            disabled={!isEditing}
          >
            <Ionicons name="arrow-down-circle" size={20} color={type === 'expense' ? '#fff' : '#ff3b30'} />
            <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
              支出
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
            onPress={() => {
              setType('income');
              setCategoryId('');
            }}
            disabled={!isEditing}
          >
            <Ionicons name="arrow-up-circle" size={20} color={type === 'income' ? '#fff' : '#34c759'} />
            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
              收入
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 分类选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>分类</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => isEditing && setShowCategoryModal(true)}
          disabled={!isEditing}
        >
          {currentCategory ? (
            <View style={styles.selectedCategory}>
              <View style={[styles.selectedCategoryIcon, { backgroundColor: currentCategory.color || '#007AFF' }]}>
                <Ionicons name={currentCategory.icon || 'pricetag'} size={18} color="#fff" />
              </View>
              <Text style={styles.selectedCategoryText}>{currentCategory.name}</Text>
            </View>
          ) : (
            <Text style={styles.selectorPlaceholder}>选择分类</Text>
          )}
          {isEditing && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
        </TouchableOpacity>
      </View>

      {/* 描述 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>描述</Text>
        <TextInput
          style={styles.textInput}
          value={description}
          onChangeText={setDescription}
          placeholder="输入交易描述..."
          placeholderTextColor="#999"
          editable={isEditing}
          multiline
        />
      </View>

      {/* 详细备注 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>详细备注</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="添加更多详细信息..."
          placeholderTextColor="#999"
          editable={isEditing}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* 标签 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>标签</Text>
          <Text style={styles.tagHint}>最多5个</Text>
        </View>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Ionicons name="close-circle" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && tags.length < 5 && (
            showTagInput ? (
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="新标签"
                  placeholderTextColor="#999"
                  autoFocus
                  onSubmitEditing={handleAddTag}
                  maxLength={10}
                />
                <TouchableOpacity onPress={handleAddTag}>
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addTagButton} onPress={() => setShowTagInput(true)}>
                <Ionicons name="add" size={16} color="#007AFF" />
                <Text style={styles.addTagText}>添加</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* 位置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>位置</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <TextInput
            style={styles.locationInput}
            value={location}
            onChangeText={setLocation}
            placeholder="添加位置信息..."
            placeholderTextColor="#999"
            editable={isEditing}
          />
        </View>
      </View>

      {/* 支付方式 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>支付方式</Text>
        <View style={styles.paymentMethods}>
          {['cash', 'alipay', 'wechat', 'card', 'other'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentMethod, paymentMethod === method && styles.paymentMethodActive]}
              onPress={() => isEditing && setPaymentMethod(method)}
              disabled={!isEditing}
            >
              <Ionicons
                name={
                  method === 'cash' ? 'cash-outline' :
                  method === 'alipay' ? 'logo-alipay' :
                  method === 'wechat' ? 'logo-wechat' :
                  method === 'card' ? 'card-outline' :
                  'wallet-outline'
                }
                size={20}
                color={paymentMethod === method ? '#007AFF' : '#666'}
              />
              <Text style={[styles.paymentMethodText, paymentMethod === method && styles.paymentMethodTextActive]}>
                {method === 'cash' ? '现金' :
                 method === 'alipay' ? '支付宝' :
                 method === 'wechat' ? '微信' :
                 method === 'card' ? '银行卡' :
                 '其他'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonSection}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{isNew ? '创建' : '保存'}</Text>
              )}
            </TouchableOpacity>
            {!isNew && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={20} color="#fff" />
              <Text style={styles.editButtonText}>编辑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              <Text style={styles.deleteButtonText}>删除</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 分类选择模态框 */}
      <CategoryPickerModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagHint: {
    fontSize: 12,
    color: '#999',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#333',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 44,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addTagText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagInput: {
    fontSize: 13,
    color: '#333',
    padding: 0,
    minWidth: 60,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  paymentMethodActive: {
    backgroundColor: '#e3f2fd',
  },
  paymentMethodText: {
    fontSize: 13,
    color: '#666',
  },
  paymentMethodTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
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
