import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddTransactionScreen() {
  const [type, setType] = useState('expense'); // expense 或 income
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [platform, setPlatform] = useState('other'); // alipay, wechat, other

  const handleSave = () => {
    if (!amount || !category) {
      Alert.alert('提示', '请填写金额和分类');
      return;
    }

    // 这里可以添加保存记账的逻辑
    Alert.alert('成功', '记账已保存');
    
    // 重置表单
    setAmount('');
    setCategory('');
    setDescription('');
    setPaymentMethod('');
    setPlatform('other');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* 收支类型选择 */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
              支出
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
              收入
            </Text>
          </TouchableOpacity>
        </View>

        {/* 金额输入 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>金额</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="请输入金额"
            keyboardType="decimal-pad"
          />
        </View>

        {/* 分类选择 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>分类</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="请输入分类"
          />
        </View>

        {/* 平台选择 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>平台</Text>
          <View style={styles.platformSelector}>
            <TouchableOpacity
              style={[styles.platformButton, platform === 'alipay' && styles.platformButtonActive]}
              onPress={() => setPlatform('alipay')}
            >
              <Text style={[styles.platformButtonText, platform === 'alipay' && styles.platformButtonTextActive]}>
                支付宝
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.platformButton, platform === 'wechat' && styles.platformButtonActive]}
              onPress={() => setPlatform('wechat')}
            >
              <Text style={[styles.platformButtonText, platform === 'wechat' && styles.platformButtonTextActive]}>
                微信
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.platformButton, platform === 'other' && styles.platformButtonActive]}
              onPress={() => setPlatform('other')}
            >
              <Text style={[styles.platformButtonText, platform === 'other' && styles.platformButtonTextActive]}>
                其他
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 支付方式 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>支付方式</Text>
          <TextInput
            style={styles.input}
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder="请输入支付方式"
          />
        </View>

        {/* 日期 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>日期</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* 描述 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="请输入描述"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 30,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  platformSelector: {
    flexDirection: 'row',
  },
  platformButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  platformButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  platformButtonText: {
    fontSize: 14,
    color: '#333',
  },
  platformButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});