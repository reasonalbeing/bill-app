import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseNaturalLanguage, analyzeSpending, getBudgetAdvice } from '../../services/aiService';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { getCurrentUser } from '../../services/authService';
import { getAIConfig } from '../../services/aiConfigService';

export default function AIChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的智能记账助手 🤖\n\n你可以这样跟我聊天：\n• "中午吃饭花了25元"\n• "今天工资到账8000"\n• "分析一下我这个月的消费"\n• "给我一些省钱建议"\n\n有什么我可以帮你的吗？',
      type: 'text',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const flatListRef = useRef(null);

  // 获取用户数据和hooks
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  const { transactions, createTransaction } = useTransactions(userId);
  const { categories, expenseCategories, incomeCategories } = useCategories(userId);

  // 检查AI配置
  useEffect(() => {
    checkAIConfig();
  }, []);

  const checkAIConfig = async () => {
    const config = await getAIConfig();
    if (!config.isEnabled) {
      Alert.alert(
        'AI功能未启用',
        '请先配置AI服务才能使用聊天记账功能',
        [
          { text: '取消', onPress: () => navigation.goBack() },
          { text: '去配置', onPress: () => navigation.navigate('AIConfig') },
        ]
      );
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowQuickActions(false);
    setIsLoading(true);

    try {
      // 判断用户意图
      const intent = detectIntent(userMessage.content);
      let response;

      switch (intent) {
        case 'analysis':
          response = await analyzeSpending(transactions, userMessage.content);
          break;
        case 'advice':
          response = await getBudgetAdvice(transactions);
          break;
        case 'record':
        default:
          response = await parseNaturalLanguage(userMessage.content, categories);
          break;
      }

      handleAIResponse(response);
    } catch (error) {
      console.error('AI处理失败:', error);
      addMessage({
        role: 'assistant',
        content: '抱歉，处理您的请求时出错了。请检查AI配置或稍后重试。',
        type: 'text',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 检测用户意图
  const detectIntent = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('分析') || lowerText.includes('统计') || lowerText.includes('怎么样')) {
      return 'analysis';
    }
    if (lowerText.includes('建议') || lowerText.includes('怎么省') || lowerText.includes('预算')) {
      return 'advice';
    }
    return 'record';
  };

  // 处理AI响应
  const handleAIResponse = (response) => {
    switch (response.action) {
      case 'add_transaction':
        // 需要确认的交易
        setPendingTransaction(response.data);
        setShowConfirmModal(true);
        addMessage({
          role: 'assistant',
          content: `我理解了您的记账请求：\n\n💰 金额：¥${response.data.amount}\n📂 分类：${response.data.category}\n📝 描述：${response.data.description}\n📅 日期：${response.data.date}\n\n请确认以上信息是否正确？`,
          type: 'confirm',
        });
        break;

      case 'need_more_info':
        addMessage({
          role: 'assistant',
          content: response.message,
          type: 'text',
        });
        break;

      case 'analysis':
      case 'advice':
      case 'reply':
        addMessage({
          role: 'assistant',
          content: response.message,
          type: 'text',
        });
        break;

      case 'error':
        addMessage({
          role: 'assistant',
          content: response.message || '处理失败，请重试',
          type: 'error',
        });
        break;

      default:
        addMessage({
          role: 'assistant',
          content: '我没有理解您的意思，请尝试用更具体的方式描述，比如"吃饭花了30元"。',
          type: 'text',
        });
    }
  };

  // 添加消息到列表
  const addMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      ...message,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // 确认添加交易
  const confirmAddTransaction = async () => {
    if (!pendingTransaction) return;

    setShowConfirmModal(false);

    // 查找分类ID
    const category = categories.find(c => c.name === pendingTransaction.category);
    const categoryId = category ? category.id : null;

    const transactionData = {
      amount: pendingTransaction.amount,
      type: pendingTransaction.type,
      category_id: categoryId,
      description: pendingTransaction.description,
      date: pendingTransaction.date,
      platform: 'other',
      is_from_ai: true,
    };

    const result = await createTransaction(transactionData);

    if (result.success) {
      addMessage({
        role: 'assistant',
        content: '✅ 记账成功！已为您记录这笔交易。',
        type: 'success',
      });
    } else {
      addMessage({
        role: 'assistant',
        content: '❌ 记账失败，请重试或手动添加。',
        type: 'error',
      });
    }

    setPendingTransaction(null);
  };

  // 取消添加交易
  const cancelAddTransaction = () => {
    setShowConfirmModal(false);
    setPendingTransaction(null);
    addMessage({
      role: 'assistant',
      content: '已取消记账。您可以重新描述或修改信息后再次尝试。',
      type: 'text',
    });
  };

  // 快速操作
  const quickActions = [
    { icon: 'restaurant-outline', text: '吃饭记账', example: '中午吃饭花了35元' },
    { icon: 'bus-outline', text: '交通记账', example: '打车回家28元' },
    { icon: 'cart-outline', text: '购物记账', example: '超市买东西156元' },
    { icon: 'trending-up-outline', text: '收入记账', example: '今天工资到账8000' },
    { icon: 'bar-chart-outline', text: '消费分析', example: '分析一下我的消费' },
    { icon: 'bulb-outline', text: '省钱建议', example: '给我一些省钱建议' },
  ];

  // 渲染消息气泡
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={20} color="#007AFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* 快速操作栏 */}
      {showQuickActions && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>快速操作</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => {
                  setInputText(action.example);
                  setShowQuickActions(false);
                }}
              >
                <Ionicons name={action.icon} size={24} color="#007AFF" />
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.quickActionsToggle}
          onPress={() => setShowQuickActions(!showQuickActions)}
        >
          <Ionicons name={showQuickActions ? 'chevron-down' : 'chevron-up'} size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="输入记账内容或问题..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* 确认模态框 */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={cancelAddTransaction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#007AFF" />
              <Text style={styles.modalTitle}>确认记账</Text>
            </View>

            {pendingTransaction && (
              <View style={styles.transactionPreview}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>金额</Text>
                  <Text style={styles.previewValue}>¥{pendingTransaction.amount}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>类型</Text>
                  <Text style={styles.previewValue}>
                    {pendingTransaction.type === 'expense' ? '支出' : '收入'}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>分类</Text>
                  <Text style={styles.previewValue}>{pendingTransaction.category}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>描述</Text>
                  <Text style={styles.previewValue}>{pendingTransaction.description}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>日期</Text>
                  <Text style={styles.previewValue}>{pendingTransaction.date}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelAddTransaction}
              >
                <Text style={styles.cancelButtonText}>修改</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmAddTransaction}
              >
                <Text style={styles.confirmButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActionsTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  quickActionText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickActionsToggle: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  transactionPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
