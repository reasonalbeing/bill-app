import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { parseCSV, detectBillType, parseAlipayBill, parseWechatBill, convertToAppFormat } from '../../services/csvParserService';
import { useCategories } from '../../hooks/useCategories';
import { getCurrentUser } from '../../services/authService';

export default function ImportScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  
  // 获取当前用户ID
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  
  // 获取分类列表
  const { categories, expenseCategories } = useCategories(userId);

  // 选择文件
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file);
      setIsLoading(true);

      // 读取文件内容
      const response = await fetch(file.uri);
      const content = await response.text();

      // 解析CSV
      const { headers, data } = await parseCSV(content);
      
      // 检测账单类型
      const billType = detectBillType(headers);
      
      if (billType === 'unknown') {
        Alert.alert('无法识别', '无法识别该文件的账单类型，请确保是支付宝或微信账单文件');
        setIsLoading(false);
        return;
      }

      // 解析交易数据
      let transactions = [];
      if (billType === 'alipay') {
        transactions = parseAlipayBill(data);
      } else if (billType === 'wechat') {
        transactions = parseWechatBill(data);
      }

      if (transactions.length === 0) {
        Alert.alert('无数据', '未找到有效的交易记录');
        setIsLoading(false);
        return;
      }

      // 转换为应用格式
      const appTransactions = convertToAppFormat(transactions, expenseCategories, userId);

      setParsedData({
        fileName: file.name,
        billType,
        transactions: appTransactions,
        rawTransactions: transactions,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('选择文件失败:', error);
      Alert.alert('错误', '读取文件失败: ' + error.message);
      setIsLoading(false);
    }
  };

  // 进入预览页面
  const handlePreview = () => {
    if (!parsedData) return;
    
    navigation.navigate('ImportPreview', {
      transactions: parsedData.transactions,
      rawTransactions: parsedData.rawTransactions,
      fileName: parsedData.fileName,
      billType: parsedData.billType,
    });
  };

  // 获取账单类型显示文本
  const getBillTypeText = (type) => {
    switch (type) {
      case 'alipay':
        return '支付宝账单';
      case 'wechat':
        return '微信账单';
      default:
        return '未知类型';
    }
  };

  // 获取账单类型图标
  const getBillTypeIcon = (type) => {
    switch (type) {
      case 'alipay':
        return 'logo-alipay';
      case 'wechat':
        return 'logo-wechat';
      default:
        return 'document-outline';
    }
  };

  // 获取账单类型颜色
  const getBillTypeColor = (type) => {
    switch (type) {
      case 'alipay':
        return '#1677FF';
      case 'wechat':
        return '#07C160';
      default:
        return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 说明卡片 */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.infoTitle}>如何导出账单</Text>
        <View style={styles.infoSteps}>
          <Text style={styles.infoStep}>1. 支付宝：我的 → 账单 → 右上角... → 开具交易流水证明 → 用于个人对账</Text>
          <Text style={styles.infoStep}>2. 微信：我 → 服务 → 钱包 → 账单 → 常见问题 → 下载账单 → 用于个人对账</Text>
        </View>
      </View>

      {/* 选择文件按钮 */}
      <TouchableOpacity 
        style={styles.selectButton}
        onPress={handleSelectFile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#007AFF" size="large" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={48} color="#007AFF" />
            <Text style={styles.selectButtonText}>选择账单文件</Text>
            <Text style={styles.selectButtonSubText}>支持 CSV 格式的支付宝/微信账单</Text>
          </>
        )}
      </TouchableOpacity>

      {/* 文件信息 */}
      {selectedFile && (
        <View style={styles.fileCard}>
          <View style={styles.fileHeader}>
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
            <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
          </View>
          <Text style={styles.fileSize}>
            大小: {(selectedFile.size / 1024).toFixed(2)} KB
          </Text>
        </View>
      )}

      {/* 解析结果 */}
      {parsedData && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={[styles.billTypeIcon, { backgroundColor: `${getBillTypeColor(parsedData.billType)}20` }]}>
              <Ionicons name={getBillTypeIcon(parsedData.billType)} size={28} color={getBillTypeColor(parsedData.billType)} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.billTypeText}>{getBillTypeText(parsedData.billType)}</Text>
              <Text style={styles.transactionCount}>
                共 {parsedData.transactions.length} 笔交易
              </Text>
            </View>
          </View>

          {/* 统计信息 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>支出</Text>
              <Text style={styles.statExpense}>
                -{parsedData.transactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>收入</Text>
              <Text style={styles.statIncome}>
                +{parsedData.transactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </Text>
            </View>
          </View>

          {/* 预览按钮 */}
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={handlePreview}
          >
            <Text style={styles.previewButtonText}>查看并导入</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* 注意事项 */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>注意事项</Text>
        <Text style={styles.tipsItem}>• 仅支持 CSV 格式的账单文件</Text>
        <Text style={styles.tipsItem}>• 导入前请确保账单文件未损坏</Text>
        <Text style={styles.tipsItem}>• 系统会自动识别重复交易并跳过</Text>
        <Text style={styles.tipsItem}>• 导入后可在账单列表中查看</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    marginBottom: 12,
  },
  infoSteps: {
    gap: 8,
  },
  infoStep: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  selectButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  selectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
  },
  selectButtonSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  fileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  billTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    marginLeft: 16,
  },
  billTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transactionCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  statExpense: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
  },
  statIncome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34c759',
  },
  previewButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  tipsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
});
