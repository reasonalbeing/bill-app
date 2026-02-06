import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { getCurrentUser } from '../../services/authService';

export default function AddTransactionScreen({ navigation }) {
  const [type, setType] = useState('expense'); // expense 或 income
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [platform, setPlatform] = useState('other'); // alipay, wechat, other
  
  // 模态框状态
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(date);
  
  // 获取当前用户ID
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  
  // 使用自定义Hooks
  const { createTransaction, loading: transactionLoading } = useTransactions(userId);
  const { 
    expenseCategories, 
    incomeCategories, 
    loading: categoriesLoading,
    initializeDefaultCategories 
  } = useCategories(userId);

  // 初始化默认分类
  useEffect(() => {
    if (userId) {
      initializeDefaultCategories();
    }
  }, [userId]);

  // 获取当前类型的分类列表
  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  // 获取选中的分类信息
  const selectedCategory = currentCategories.find(c => c.id === categoryId);

  // 保存记账
  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }

    if (!categoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }

    const transactionData = {
      amount: parseFloat(amount),
      type,
      category_id: categoryId,
      description: description.trim(),
      date,
      payment_method: paymentMethod.trim(),
      platform,
    };

    const result = await createTransaction(transactionData);
    
    if (result.success) {
      Alert.alert('成功', '记账已保存', [
        { 
          text: '继续记账', 
          onPress: () => resetForm() 
        },
        { 
          text: '返回列表', 
          onPress: () => navigation.navigate('Transactions'),
          style: 'cancel'
        }
      ]);
    } else {
      Alert.alert('保存失败', result.error || '请稍后重试');
    }
  };

  // 重置表单
  const resetForm = () => {
    setAmount('');
    setCategoryId('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    setPlatform('other');
  };

  // 格式化日期显示
  const formatDateDisplay = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return '今天';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  };

  // 日期选择器组件
  const DatePickerModal = () => {
    const [year, month, day] = tempDate.split('-').map(Number);
    
    const generateYears = () => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    };
    
    const generateMonths = () => Array.from({ length: 12 }, (_, i) => i + 1);
    const generateDays = () => Array.from({ length: 31 }, (_, i) => i + 1);

    return (
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择日期</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              <ScrollView style={styles.dateColumn}>
                {generateYears().map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.dateItem, year === y && styles.dateItemActive]}
                    onPress={() => setTempDate(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  >
                    <Text style={[styles.dateItemText, year === y && styles.dateItemTextActive]}>{y}年</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <ScrollView style={styles.dateColumn}>
                {generateMonths().map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.dateItem, month === m && styles.dateItemActive]}
                    onPress={() => setTempDate(`${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  >
                    <Text style={[styles.dateItemText, month === m && styles.dateItemTextActive]}>{m}月</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <ScrollView style={styles.dateColumn}>
                {generateDays().map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dateItem, day === d && styles.dateItemActive]}
                    onPress={() => setTempDate(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
                  >
                    <Text style={[styles.dateItemText, day === d && styles.dateItemTextActive]}>{d}日</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => {
                setDate(tempDate);
                setShowDateModal(false);
              }}
            >
              <Text style={styles.modalConfirmButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // 分类选择器组件
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
          
          {categoriesLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.modalLoading} />
          ) : currentCategories.length === 0 ? (
            <View style={styles.emptyCategories}>
              <Text style={styles.emptyCategoriesText}>暂无分类</Text>
            </View>
          ) : (
            <ScrollView style={styles.categoryList}>
              {currentCategories.map(category => (
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
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* 收支类型选择 */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => {
              setType('expense');
              setCategoryId('');
            }}
          >
            <Ionicons 
              name="arrow-down-circle" 
              size={20} 
              color={type === 'expense' ? '#fff' : '#ff3b30'} 
            />
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
          >
            <Ionicons 
              name="arrow-up-circle" 
              size={20} 
              color={type === 'income' ? '#fff' : '#34c759'} 
            />
            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
              收入
            </Text>
          </TouchableOpacity>
        </View>

        {/* 金额输入 */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>¥</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#ccc"
          />
        </View>

        {/* 分类选择 */}
        <TouchableOpacity 
          style={styles.selectorContainer}
          onPress={() => setShowCategoryModal(true)}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="pricetag-outline" size={20} color="#666" />
            <Text style={styles.selectorLabel}>分类</Text>
          </View>
          <View style={styles.selectorRight}>
            {selectedCategory ? (
              <View style={styles.selectedCategory}>
                <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color || '#007AFF' }]}>
                  <Ionicons name={selectedCategory.icon || 'pricetag'} size={14} color="#fff" />
                </View>
                <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>请选择分类</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        {/* 日期选择 */}
        <TouchableOpacity 
          style={styles.selectorContainer}
          onPress={() => {
            setTempDate(date);
            setShowDateModal(true);
          }}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.selectorLabel}>日期</Text>
          </View>
          <View style={styles.selectorRight}>
            <Text style={styles.selectorValue}>{formatDateDisplay(date)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        {/* 平台选择 */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionLabel}>支付平台</Text>
          <View style={styles.platformSelector}>
            <TouchableOpacity
              style={[styles.platformButton, platform === 'alipay' && styles.platformButtonActive]}
              onPress={() => setPlatform('alipay')}
            >
              <Ionicons 
                name="logo-alipay" 
                size={24} 
                color={platform === 'alipay' ? '#1677FF' : '#999'} 
              />
              <Text style={[styles.platformButtonText, platform === 'alipay' && styles.platformButtonTextActive]}>
                支付宝
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.platformButton, platform === 'wechat' && styles.platformButtonActive]}
              onPress={() => setPlatform('wechat')}
            >
              <Ionicons 
                name="logo-wechat" 
                size={24} 
                color={platform === 'wechat' ? '#07C160' : '#999'} 
              />
              <Text style={[styles.platformButtonText, platform === 'wechat' && styles.platformButtonTextActive]}>
                微信
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.platformButton, platform === 'other' && styles.platformButtonActive]}
              onPress={() => setPlatform('other')}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={platform === 'other' ? '#333' : '#999'} 
              />
              <Text style={[styles.platformButtonText, platform === 'other' && styles.platformButtonTextActive]}>
                其他
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 支付方式 */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionLabel}>支付方式（选填）</Text>
          <TextInput
            style={styles.input}
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder="如：余额宝、信用卡、现金等"
            placeholderTextColor="#ccc"
          />
        </View>

        {/* 描述 */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionLabel}>备注（选填）</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="添加备注信息..."
            placeholderTextColor="#ccc"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity 
          style={[styles.saveButton, transactionLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={transactionLoading}
        >
          {transactionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 模态框 */}
      <CategoryPickerModal />
      <DatePickerModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#333',
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 40,
    color: '#333',
    fontWeight: '600',
    minWidth: 150,
    textAlign: 'center',
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: '#999',
    marginRight: 4,
  },
  selectorValue: {
    fontSize: 15,
    color: '#333',
    marginRight: 4,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  selectedCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  selectedCategoryText: {
    fontSize: 15,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  platformSelector: {
    flexDirection: 'row',
  },
  platformButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  platformButtonActive: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  platformButtonText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  platformButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  input: {
    fontSize: 15,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  categoryList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  emptyCategories: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 16,
    color: '#999',
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 250,
  },
  dateColumn: {
    flex: 1,
  },
  dateItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateItemActive: {
    backgroundColor: '#f0f8ff',
  },
  dateItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});