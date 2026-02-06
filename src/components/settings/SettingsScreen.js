import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logoutUser } from '../../services/authService';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoBackup: true,
    biometricAuth: false
  });

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('退出失败', error.message);
            }
          }
        }
      ]
    );
  };

  const toggleSetting = (key) => {
    setSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const renderSettingItem = (icon, title, value, onToggle, showArrow = false) => (
    <TouchableOpacity style={styles.settingItem} onPress={showArrow ? onToggle : null}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#007AFF" />
      </View>
      <Text style={styles.settingTitle}>{title}</Text>
      {typeof value === 'boolean' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#d1d1d6', true: '#007AFF' }}
          thumbColor="#fff"
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
      ) : (
        <Text style={styles.settingValue}>{value}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 账户设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账户设置</Text>
        {renderSettingItem('person-outline', '个人资料', '', () => {}, true)}
        {renderSettingItem('lock-closed-outline', '修改密码', '', () => {}, true)}
        {renderSettingItem('mail-outline', '邮箱设置', '', () => {}, true)}
      </View>

      {/* 应用设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>
        {renderSettingItem('notifications-outline', '通知提醒', settings.notifications, () => toggleSetting('notifications'))}
        {renderSettingItem('moon-outline', '深色模式', settings.darkMode, () => toggleSetting('darkMode'))}
        {renderSettingItem('language-outline', '语言', '简体中文', () => {}, true)}
        {renderSettingItem('currency-outline', '默认货币', '人民币 (CNY)', () => {}, true)}
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        {renderSettingItem('cloud-upload-outline', '自动备份', settings.autoBackup, () => toggleSetting('autoBackup'))}
        {renderSettingItem('download-outline', '导出数据', '', () => {
          Alert.alert('提示', '数据导出功能开发中');
        }, true)}
        {renderSettingItem('refresh-outline', '导入数据', '', () => {
          Alert.alert('提示', '数据导入功能开发中');
        }, true)}
        {renderSettingItem('trash-outline', '清理缓存', '', () => {
          Alert.alert('提示', '缓存已清理');
        }, true)}
      </View>

      {/* 安全设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>安全设置</Text>
        {renderSettingItem('finger-print-outline', '生物识别认证', settings.biometricAuth, () => toggleSetting('biometricAuth'))}
        {renderSettingItem('shield-checkmark-outline', '隐私政策', '', () => {}, true)}
        {renderSettingItem('document-text-outline', '用户协议', '', () => {}, true)}
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        {renderSettingItem('information-circle-outline', '关于我们', '', () => {}, true)}
        {renderSettingItem('star-outline', '给我们评分', '', () => {}, true)}
        {renderSettingItem('help-circle-outline', '帮助与反馈', '', () => {}, true)}
        {renderSettingItem('code-slash-outline', '版本信息', '1.0.0', () => {}, false)}
      </View>

      {/* 退出登录按钮 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>
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
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 30,
    marginRight: 15,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#8e8e93',
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginTop: 30,
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '600',
  },
});