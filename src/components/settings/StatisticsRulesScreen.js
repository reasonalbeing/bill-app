import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getStatisticsRules,
  saveStatisticsRules,
  addCustomStatisticsType,
  removeCustomStatisticsType,
  addAutoRule,
  updateAutoRule,
  removeAutoRule,
  resetToDefaultRules,
  DEFAULT_STATISTICS_TYPES,
} from '../../services/statisticsRuleService';

export default function StatisticsRulesScreen() {
  const [rules, setRules] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  // 表单状态
  const [typeName, setTypeName] = useState('');
  const [typeColor, setTypeColor] = useState('#007AFF');
  const [typeIncludeInTotal, setTypeIncludeInTotal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleKeywords, setRuleKeywords] = useState('');
  const [ruleStatisticsType, setRuleStatisticsType] = useState('transfer');

  const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93'];

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    const data = await getStatisticsRules();
    setRules(data);
    setIsLoading(false);
  };

  // 添加自定义类型
  const handleAddType = async () => {
    if (!typeName.trim()) {
      Alert.alert('提示', '请输入类型名称');
      return;
    }

    const result = await addCustomStatisticsType({
      name: typeName.trim(),
      color: typeColor,
      icon: 'pricetag',
      includeInTotal: typeIncludeInTotal,
    });

    if (result.success) {
      Alert.alert('成功', '自定义类型已添加');
      setShowTypeModal(false);
      resetTypeForm();
      loadRules();
    } else {
      Alert.alert('失败', result.error);
    }
  };

  // 添加自动规则
  const handleAddRule = async () => {
    if (!ruleName.trim() || !ruleKeywords.trim()) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }

    const result = await addAutoRule({
      name: ruleName.trim(),
      keywords: ruleKeywords.split(',').map(k => k.trim()).filter(k => k),
      statisticsType: ruleStatisticsType,
    });

    if (result.success) {
      Alert.alert('成功', '自动规则已添加');
      setShowRuleModal(false);
      resetRuleForm();
      loadRules();
    } else {
      Alert.alert('失败', result.error);
    }
  };

  // 删除自定义类型
  const handleDeleteType = (typeId) => {
    Alert.alert(
      '删除类型',
      '确定要删除这个自定义类型吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await removeCustomStatisticsType(typeId);
            if (result.success) {
              loadRules();
            } else {
              Alert.alert('失败', result.error);
            }
          },
        },
      ]
    );
  };

  // 删除自动规则
  const handleDeleteRule = (ruleId) => {
    Alert.alert(
      '删除规则',
      '确定要删除这个自动规则吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await removeAutoRule(ruleId);
            if (result.success) {
              loadRules();
            } else {
              Alert.alert('失败', result.error);
            }
          },
        },
      ]
    );
  };

  // 切换规则状态
  const handleToggleRule = async (rule) => {
    const result = await updateAutoRule(rule.id, { isActive: !rule.isActive });
    if (result.success) {
      loadRules();
    }
  };

  // 重置默认规则
  const handleReset = () => {
    Alert.alert(
      '重置规则',
      '确定要重置为默认规则吗？所有自定义设置将丢失。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: async () => {
            const result = await resetToDefaultRules();
            if (result.success) {
              Alert.alert('成功', '已重置为默认规则');
              loadRules();
            } else {
              Alert.alert('失败', result.error);
            }
          },
        },
      ]
    );
  };

  const resetTypeForm = () => {
    setTypeName('');
    setTypeColor('#007AFF');
    setTypeIncludeInTotal(false);
    setEditingType(null);
  };

  const resetRuleForm = () => {
    setRuleName('');
    setRuleKeywords('');
    setRuleStatisticsType('transfer');
    setEditingRule(null);
  };

  if (isLoading || !rules) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const allTypes = { ...rules.types, ...rules.customTypes };

  return (
    <ScrollView style={styles.container}>
      {/* 说明卡片 */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.infoText}>
          自定义统计类别可以让您更灵活地管理账单。例如：将"零钱转入零钱通"标记为"转移"，不计入收支统计。
        </Text>
      </View>

      {/* 默认统计类型 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>默认统计类型</Text>
        {Object.values(DEFAULT_STATISTICS_TYPES).map(type => (
          <View key={type.id} style={styles.typeItem}>
            <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
              <Ionicons name={type.icon} size={18} color="#fff" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>{type.name}</Text>
              <Text style={styles.typeDesc}>
                {type.includeInTotal ? '计入收支统计' : '不计入收支统计'}
              </Text>
            </View>
            {type.description && (
              <Text style={styles.typeHint}>{type.description}</Text>
            )}
          </View>
        ))}
      </View>

      {/* 自定义统计类型 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>自定义统计类型</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetTypeForm();
              setShowTypeModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>添加</Text>
          </TouchableOpacity>
        </View>

        {Object.values(rules.customTypes).length === 0 ? (
          <Text style={styles.emptyText}>暂无自定义类型</Text>
        ) : (
          Object.values(rules.customTypes).map(type => (
            <View key={type.id} style={styles.typeItem}>
              <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                <Ionicons name={type.icon} size={18} color="#fff" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc}>
                  {type.includeInTotal ? '计入收支统计' : '不计入收支统计'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteType(type.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* 自动分类规则 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>自动分类规则</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetRuleForm();
              setShowRuleModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>添加</Text>
          </TouchableOpacity>
        </View>

        {rules.autoRules.map(rule => (
          <View key={rule.id} style={styles.ruleItem}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleName}>{rule.name}</Text>
              <Switch
                value={rule.isActive}
                onValueChange={() => handleToggleRule(rule)}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
              />
            </View>
            <Text style={styles.ruleKeywords}>
              关键词: {rule.keywords.join(', ')}
            </Text>
            <View style={styles.ruleFooter}>
              <View style={[styles.typeBadge, { backgroundColor: allTypes[rule.statisticsType]?.color || '#999' }]}>
                <Text style={styles.typeBadgeText}>
                  {allTypes[rule.statisticsType]?.name || rule.statisticsType}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteRule(rule.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* 重置按钮 */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Ionicons name="refresh-outline" size={18} color="#FF3B30" />
        <Text style={styles.resetButtonText}>重置为默认规则</Text>
      </TouchableOpacity>

      {/* 添加类型模态框 */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加自定义类型</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>类型名称</Text>
            <TextInput
              style={styles.input}
              value={typeName}
              onChangeText={setTypeName}
              placeholder="例如：理财"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>颜色</Text>
            <View style={styles.colorPicker}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    typeColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setTypeColor(color)}
                />
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>计入收支统计</Text>
              <Switch
                value={typeIncludeInTotal}
                onValueChange={setTypeIncludeInTotal}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
              />
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleAddType}>
              <Text style={styles.confirmButtonText}>确认添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 添加规则模态框 */}
      <Modal
        visible={showRuleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRuleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加自动规则</Text>
              <TouchableOpacity onPress={() => setShowRuleModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>规则名称</Text>
            <TextInput
              style={styles.input}
              value={ruleName}
              onChangeText={setRuleName}
              placeholder="例如：零钱通转入"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>关键词（用逗号分隔）</Text>
            <TextInput
              style={styles.input}
              value={ruleKeywords}
              onChangeText={setRuleKeywords}
              placeholder="例如：零钱通,零钱转入"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>统计类型</Text>
            <View style={styles.typeSelector}>
              {Object.values(allTypes).map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    ruleStatisticsType === type.id && styles.typeOptionSelected,
                  ]}
                  onPress={() => setRuleStatisticsType(type.id)}
                >
                  <View style={[styles.typeOptionIcon, { backgroundColor: type.color }]}>
                    <Ionicons name={type.icon} size={14} color="#fff" />
                  </View>
                  <Text style={[
                    styles.typeOptionText,
                    ruleStatisticsType === type.id && styles.typeOptionTextSelected,
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleAddRule}>
              <Text style={styles.confirmButtonText}>确认添加</Text>
            </TouchableOpacity>
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
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  typeDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  typeHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  ruleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  ruleKeywords: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  ruleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 30,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  typeOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  typeOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  typeOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
