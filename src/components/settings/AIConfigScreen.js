import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAIConfig,
  saveAIConfig,
  clearAIConfig,
  testAPIConnection,
  getAllProviders,
  API_PROVIDERS,
} from '../../services/aiConfigService';

export default function AIConfigScreen() {
  const [config, setConfig] = useState({
    provider: 'siliconflow',
    apiKey: '',
    endpoint: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2000,
    isEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    const savedConfig = await getAIConfig();
    setConfig(savedConfig);
    setIsLoading(false);
  };

  // 保存配置
  const handleSave = async () => {
    if (!config.apiKey.trim()) {
      Alert.alert('提示', '请输入API密钥');
      return;
    }

    setIsSaving(true);
    const result = await saveAIConfig(config);
    setIsSaving(false);

    if (result.success) {
      Alert.alert('成功', '配置已保存');
    } else {
      Alert.alert('保存失败', result.error || '请稍后重试');
    }
  };

  // 测试连接
  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      Alert.alert('提示', '请先输入API密钥');
      return;
    }

    setIsTesting(true);
    const result = await testAPIConnection(config);
    setIsTesting(false);

    if (result.success) {
      Alert.alert('连接成功', 'API连接测试通过，可以正常使用');
    } else {
      Alert.alert('连接失败', result.error || '请检查配置信息');
    }
  };

  // 清除配置
  const handleClear = () => {
    Alert.alert(
      '清除配置',
      '确定要清除所有AI配置吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            const result = await clearAIConfig();
            if (result.success) {
              setConfig({
                provider: 'siliconflow',
                apiKey: '',
                endpoint: '',
                model: '',
                temperature: 0.7,
                maxTokens: 2000,
                isEnabled: false,
              });
              Alert.alert('成功', '配置已清除');
            } else {
              Alert.alert('清除失败', result.error || '请稍后重试');
            }
          }
        }
      ]
    );
  };

  // 切换提供商
  const handleChangeProvider = (providerId) => {
    const provider = API_PROVIDERS[providerId];
    setConfig({
      ...config,
      provider: providerId,
      endpoint: provider.defaultEndpoint,
      model: provider.models[0].id,
    });
    setShowProviderModal(false);
  };

  // 获取当前提供商信息
  const currentProvider = API_PROVIDERS[config.provider];

  // 渲染加载状态
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 提供商选择模态框
  const ProviderPickerModal = () => (
    <Modal
      visible={showProviderModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProviderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择API提供商</Text>
            <TouchableOpacity onPress={() => setShowProviderModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {getAllProviders().map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerItem,
                  config.provider === provider.id && styles.providerItemActive
                ]}
                onPress={() => handleChangeProvider(provider.id)}
              >
                <View style={[styles.providerIcon, { backgroundColor: `${provider.color}20` }]}>
                  <Ionicons name={provider.icon} size={24} color={provider.color} />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <Text style={styles.providerDescription}>{provider.description}</Text>
                </View>
                {config.provider === provider.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // 模型选择模态框
  const ModelPickerModal = () => (
    <Modal
      visible={showModelModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择模型</Text>
            <TouchableOpacity onPress={() => setShowModelModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {currentProvider.models.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelItem,
                  config.model === model.id && styles.modelItemActive
                ]}
                onPress={() => {
                  setConfig({ ...config, model: model.id });
                  setShowModelModal(false);
                }}
              >
                <Text style={[
                  styles.modelItemText,
                  config.model === model.id && styles.modelItemTextActive
                ]}>
                  {model.name}
                </Text>
                {config.model === model.id && (
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
      {/* 启用AI开关 */}
      <View style={styles.section}>
        <View style={styles.enableRow}>
          <View style={styles.enableLeft}>
            <Ionicons name="sparkles" size={24} color="#007AFF" />
            <View style={styles.enableTextContainer}>
              <Text style={styles.enableTitle}>启用AI功能</Text>
              <Text style={styles.enableDescription}>开启后可使用智能记账分析</Text>
            </View>
          </View>
          <Switch
            value={config.isEnabled}
            onValueChange={(value) => setConfig({ ...config, isEnabled: value })}
            trackColor={{ false: '#ddd', true: '#007AFF' }}
          />
        </View>
      </View>

      {/* API提供商选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API提供商</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowProviderModal(true)}
        >
          <View style={[styles.providerIcon, { backgroundColor: `${currentProvider.color}20` }]}>
            <Ionicons name={currentProvider.icon} size={20} color={currentProvider.color} />
          </View>
          <View style={styles.selectorTextContainer}>
            <Text style={styles.selectorLabel}>{currentProvider.name}</Text>
            <Text style={styles.selectorDescription}>{currentProvider.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* API密钥 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API密钥</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={config.apiKey}
            onChangeText={(text) => setConfig({ ...config, apiKey: text })}
            placeholder="请输入您的API密钥"
            placeholderTextColor="#ccc"
            secureTextEntry
          />
        </View>
        <Text style={styles.hintText}>
          API密钥将被安全存储在设备上，不会上传到服务器
        </Text>
      </View>

      {/* 模型选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>模型</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowModelModal(true)}
        >
          <Ionicons name="cube-outline" size={20} color="#666" style={styles.selectorIcon} />
          <Text style={styles.selectorValue}>
            {currentProvider.models.find(m => m.id === config.model)?.name || config.model}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* API端点 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API端点（可选）</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={config.endpoint}
            onChangeText={(text) => setConfig({ ...config, endpoint: text })}
            placeholder={currentProvider.defaultEndpoint}
            placeholderTextColor="#ccc"
            autoCapitalize="none"
          />
        </View>
        <Text style={styles.hintText}>
          通常不需要修改，除非使用代理或自定义端点
        </Text>
      </View>

      {/* 高级设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>高级设置</Text>
        
        {/* Temperature */}
        <View style={styles.advancedItem}>
          <View style={styles.advancedItemHeader}>
            <Text style={styles.advancedItemLabel}>Temperature</Text>
            <Text style={styles.advancedItemValue}>{config.temperature}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setConfig({ ...config, temperature: Math.max(0, config.temperature - 0.1) })}
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${config.temperature * 100}%` }]} />
            </View>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setConfig({ ...config, temperature: Math.min(1, config.temperature + 0.1) })}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sliderHint}>较低值使回答更确定，较高值使回答更创造性</Text>
        </View>

        {/* Max Tokens */}
        <View style={styles.advancedItem}>
          <View style={styles.advancedItemHeader}>
            <Text style={styles.advancedItemLabel}>最大Token数</Text>
            <Text style={styles.advancedItemValue}>{config.maxTokens}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setConfig({ ...config, maxTokens: Math.max(500, config.maxTokens - 500) })}
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(config.maxTokens / 4000) * 100}%` }]} />
            </View>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setConfig({ ...config, maxTokens: Math.min(4000, config.maxTokens + 500) })}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.testButton, isTesting && styles.buttonDisabled]}
          onPress={handleTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={20} color="#007AFF" />
              <Text style={styles.testButtonText}>测试连接</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存配置</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClear}
        >
          <Ionicons name="trash-outline" size={18} color="#ff3b30" />
          <Text style={styles.clearButtonText}>清除配置</Text>
        </TouchableOpacity>
      </View>

      {/* 提示信息 */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>使用说明</Text>
        <Text style={styles.tipsItem}>• 推荐使用硅基流动，支持DeepSeek等开源模型，性价比高</Text>
        <Text style={styles.tipsItem}>• API密钥可以在各平台的开发者中心获取</Text>
        <Text style={styles.tipsItem}>• 配置完成后建议先测试连接再保存</Text>
        <Text style={styles.tipsItem}>• 密钥存储在设备本地，请妥善保管</Text>
      </View>

      {/* 模态框 */}
      <ProviderPickerModal />
      <ModelPickerModal />
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
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  enableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enableTextContainer: {
    marginLeft: 12,
  },
  enableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  enableDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorIcon: {
    marginRight: 12,
  },
  selectorTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  selectorLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  selectorDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  selectorValue: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    lineHeight: 18,
  },
  advancedItem: {
    marginBottom: 20,
  },
  advancedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  advancedItemLabel: {
    fontSize: 14,
    color: '#333',
  },
  advancedItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  sliderHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  clearButtonText: {
    fontSize: 15,
    color: '#ff3b30',
    marginLeft: 6,
  },
  tipsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 15,
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
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  providerItemActive: {
    backgroundColor: '#f0f8ff',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  providerDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelItemActive: {
    backgroundColor: '#f0f8ff',
  },
  modelItemText: {
    fontSize: 15,
    color: '#333',
  },
  modelItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
