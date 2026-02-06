import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, logout } from '../../services/authService';
import { getAIConfig, API_PROVIDERS } from '../../services/aiConfigService';

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 加载用户信息和AI配置
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // 获取AI配置
    const config = await getAIConfig();
    setAiConfig(config);
    
    setIsLoading(false);
  };

  // 处理登出
  const handleLogout = async () => {
    setShowLogoutModal(false);
    const result = await logout();
    if (result.success) {
      navigation.replace('Login');
    } else {
      Alert.alert('登出失败', result.error || '请稍后重试');
    }
  };

  // 获取AI配置状态显示
  const getAIStatusText = () => {
    if (!aiConfig || !aiConfig.isEnabled) {
      return '未启用';
    }
    const provider = API_PROVIDERS[aiConfig.provider];
    return provider ? provider.name : '已配置';
  };

  // 获取AI配置状态颜色
  const getAIStatusColor = () => {
    if (!aiConfig || !aiConfig.isEnabled) {
      return '#999';
    }
    const provider = API_PROVIDERS[aiConfig.provider];
    return provider ? provider.color : '#007AFF';
  };

  // 设置项组件
  const SettingItem = ({ icon, iconColor, title, subtitle, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && <Ionicons name="chevron-forward" size={20} color="#ccc" />)}
    </TouchableOpacity>
  );

  // 渲染加载状态
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息卡片 */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Ionicons name="person-circle" size={64} color="#007AFF" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.displayName || user?.email?.split('@')[0] || '用户'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || '未登录'}</Text>
        </View>
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        <SettingItem
          icon="cloud-download-outline"
          iconColor="#1677FF"
          title="导入账单"
          subtitle="从支付宝/微信导入账单"
          onPress={() => navigation.navigate('Import')}
        />
        <SettingItem
          icon="swap-horizontal-outline"
          iconColor="#07C160"
          title="数据同步"
          subtitle="同步云端数据"
          onPress={() => Alert.alert('提示', '数据同步功能开发中')}
        />
        <SettingItem
          icon="cloud-upload-outline"
          iconColor="#FF6A00"
          title="备份与恢复"
          subtitle="备份数据到本地或导入备份"
          onPress={() => navigation.navigate('Backup')}
        />
      </View>

      {/* AI功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI功能</Text>
        <SettingItem
          icon="sparkles"
          iconColor={getAIStatusColor()}
          title="AI服务配置"
          subtitle={getAIStatusText()}
          onPress={() => navigation.navigate('AIConfig')}
          rightComponent={
            aiConfig?.isEnabled && (
              <View style={[styles.aiBadge, { backgroundColor: `${getAIStatusColor()}20` }]}>
                <View style={[styles.aiDot, { backgroundColor: getAIStatusColor() }]} />
                <Text style={[styles.aiBadgeText, { color: getAIStatusColor() }]}>已启用</Text>
              </View>
            )
          }
        />
        <SettingItem
          icon="chatbubble-ellipses-outline"
          iconColor="#8E8E93"
          title="AI聊天记账"
          subtitle="通过聊天方式记账"
          onPress={() => navigation.navigate('AIChat')}
        />
        <SettingItem
          icon="analytics-outline"
          iconColor="#34C759"
          title="统计规则设置"
          subtitle="自定义统计类别和规则"
          onPress={() => navigation.navigate('StatisticsRules')}
        />
        <SettingItem
          icon="scan-outline"
          iconColor="#FF9500"
          title="OCR识别"
          subtitle="拍照识别发票和收据"
          onPress={() => navigation.navigate('OCR')}
        />
        <SettingItem
          icon="analytics-outline"
          iconColor="#34C759"
          title="智能分析"
          subtitle="AI分析消费情况"
          onPress={() => Alert.alert('提示', 'AI分析功能开发中')}
        />
      </View>

      {/* 通用设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通用设置</Text>
        <SettingItem
          icon="notifications-outline"
          iconColor="#FF9500"
          title="通知设置"
          subtitle="预算提醒、记账提醒"
          onPress={() => Alert.alert('提示', '通知设置功能开发中')}
        />
        <SettingItem
          icon="moon-outline"
          iconColor="#5856D6"
          title="深色模式"
          subtitle="跟随系统"
          onPress={() => Alert.alert('提示', '深色模式功能开发中')}
        />
        <SettingItem
          icon="language-outline"
          iconColor="#34C759"
          title="语言"
          subtitle="简体中文"
          onPress={() => Alert.alert('提示', '语言设置功能开发中')}
        />
        <SettingItem
          icon="cash-outline"
          iconColor="#FF2D55"
          title="货币"
          subtitle="人民币 (¥)"
          onPress={() => Alert.alert('提示', '货币设置功能开发中')}
        />
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <SettingItem
          icon="help-circle-outline"
          iconColor="#007AFF"
          title="帮助与反馈"
          subtitle="常见问题、意见反馈"
          onPress={() => Alert.alert('提示', '帮助功能开发中')}
        />
        <SettingItem
          icon="star-outline"
          iconColor="#FFCC00"
          title="给我们评分"
          subtitle="在应用商店评价"
          onPress={() => Alert.alert('提示', '评分功能开发中')}
        />
        <SettingItem
          icon="information-circle-outline"
          iconColor="#8E8E93"
          title="关于"
          subtitle="版本 1.0.0"
          onPress={() => Alert.alert('关于', '手机记账软件 v1.0.0\n\n一款简单易用的个人记账应用')}
          showArrow={false}
        />
      </View>

      {/* 登出按钮 */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
      >
        <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>

      {/* 版本信息 */}
      <Text style={styles.versionText}>版本 1.0.0</Text>

      {/* 登出确认模态框 */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>确认退出登录？</Text>
            <Text style={styles.modalMessage}>退出后需要重新登录才能使用</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.modalConfirmText}>退出</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userAvatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 30,
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#ff3b30',
    marginLeft: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
