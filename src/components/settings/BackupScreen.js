import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createBackup,
  getBackupList,
  shareBackup,
  deleteBackup,
  restoreFromBackup,
  importBackupFromFile,
} from '../../services/backupService';

export default function BackupScreen({ navigation }) {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [customName, setCustomName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // 加载备份列表
  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    const result = await getBackupList();
    if (result.success) {
      setBackups(result.backups);
    }
    setIsLoading(false);
  };

  // 创建新备份
  const handleCreateBackup = async () => {
    if (showNameInput) {
      if (!customName.trim()) {
        Alert.alert('提示', '请输入备份名称');
        return;
      }
      setIsCreating(true);
      const result = await createBackup(customName.trim());
      setIsCreating(false);
      setShowNameInput(false);
      setCustomName('');

      if (result.success) {
        Alert.alert('成功', '备份已创建');
        loadBackups();
      } else {
        Alert.alert('失败', result.error || '备份创建失败');
      }
    } else {
      setShowNameInput(true);
    }
  };

  // 导入备份
  const handleImportBackup = async () => {
    Alert.alert(
      '导入备份',
      '请选择要导入的备份文件（JSON格式）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '选择文件',
          onPress: async () => {
            setIsLoading(true);
            const result = await importBackupFromFile();
            setIsLoading(false);

            if (result.success) {
              Alert.alert(
                '导入成功',
                `文件 "${result.fileName}" 已导入，是否立即恢复？`,
                [
                  { text: '稍后', onPress: loadBackups },
                  {
                    text: '立即恢复',
                    onPress: () => {
                      setSelectedBackup({
                        filePath: result.filePath,
                        fileName: result.fileName,
                      });
                      setShowRestoreModal(true);
                    },
                  },
                ]
              );
            } else if (!result.canceled) {
              Alert.alert('导入失败', result.error || '请检查文件格式');
            }
          },
        },
      ]
    );
  };

  // 分享备份
  const handleShareBackup = async (backup) => {
    const result = await shareBackup(backup.filePath);
    if (!result.success) {
      Alert.alert('分享失败', result.error);
    }
  };

  // 删除备份
  const handleDeleteBackup = (backup) => {
    Alert.alert(
      '删除备份',
      `确定要删除 "${backup.fileName}" 吗？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteBackup(backup.filePath);
            if (result.success) {
              loadBackups();
            } else {
              Alert.alert('删除失败', result.error);
            }
          },
        },
      ]
    );
  };

  // 恢复备份
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setShowRestoreModal(false);
    setIsLoading(true);
    const result = await restoreFromBackup(selectedBackup.filePath);
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        '恢复成功',
        '数据已恢复，建议重启应用以确保所有数据正确加载。',
        [
          {
            text: '确定',
            onPress: () => {
              // 可以在这里添加重启应用的逻辑
            },
          },
        ]
      );
    } else {
      Alert.alert('恢复失败', result.error || '请检查备份文件是否完整');
    }

    setSelectedBackup(null);
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 格式化日期
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 渲染备份项
  const renderBackupItem = ({ item }) => (
    <View style={[styles.backupItem, item.isInvalid && styles.invalidBackupItem]}>
      <View style={styles.backupInfo}>
        <View style={styles.backupHeader}>
          <Ionicons
            name={item.isInvalid ? 'warning-outline' : 'document-text-outline'}
            size={24}
            color={item.isInvalid ? '#FF9500' : '#007AFF'}
          />
          <View style={styles.backupTitleContainer}>
            <Text style={styles.backupName} numberOfLines={1}>
              {item.fileName}
            </Text>
            <Text style={styles.backupMeta}>
              {item.isInvalid ? '文件已损坏' : `${formatFileSize(item.size)} · ${formatDate(item.timestamp)}`}
            </Text>
          </View>
        </View>
      </View>

      {!item.isInvalid && (
        <View style={styles.backupActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareBackup(item)}
          >
            <Ionicons name="share-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedBackup(item);
              setShowRestoreModal(true);
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteBackup(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 操作按钮区域 */}
      <View style={styles.actionSection}>
        {showNameInput ? (
          <View style={styles.nameInputContainer}>
            <TextInput
              style={styles.nameInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="输入备份名称"
              placeholderTextColor="#999"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.createButton, isCreating && styles.buttonDisabled]}
              onPress={handleCreateBackup}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>确认</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowNameInput(false);
                setCustomName('');
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.mainButton, styles.backupButton]}
              onPress={() => setShowNameInput(true)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.mainButtonText}>创建备份</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mainButton, styles.importButton]}
              onPress={handleImportBackup}
            >
              <Ionicons name="download-outline" size={20} color="#007AFF" />
              <Text style={[styles.mainButtonText, styles.importButtonText]}>导入备份</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 备份列表 */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>备份历史</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : backups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>暂无备份</Text>
            <Text style={styles.emptySubText}>点击上方按钮创建备份</Text>
          </View>
        ) : (
          <FlatList
            data={backups}
            renderItem={renderBackupItem}
            keyExtractor={(item) => item.filePath}
            contentContainerStyle={styles.listContent}
            refreshing={isLoading}
            onRefresh={loadBackups}
          />
        )}
      </View>

      {/* 恢复确认模态框 */}
      <Modal
        visible={showRestoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color="#FF9500" />
              <Text style={styles.modalTitle}>确认恢复</Text>
            </View>
            <Text style={styles.modalMessage}>
              恢复备份将覆盖当前所有数据（账单、分类、预算等），此操作不可撤销。
            </Text>
            {selectedBackup && (
              <View style={styles.selectedBackupInfo}>
                <Text style={styles.selectedBackupName}>{selectedBackup.fileName}</Text>
                <Text style={styles.selectedBackupTime}>
                  {formatDate(selectedBackup.timestamp)}
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleRestoreBackup}
              >
                <Text style={styles.modalConfirmText}>确认恢复</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actionSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  backupButton: {
    backgroundColor: '#007AFF',
  },
  importButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  importButtonText: {
    color: '#007AFF',
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listSection: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  invalidBackupItem: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  backupInfo: {
    flex: 1,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backupTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  backupName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  backupMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectedBackupInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  selectedBackupName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedBackupTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#FF9500',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
