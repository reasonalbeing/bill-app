import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { recognizeImage, extractTransactionInfo } from '../../services/ocrService';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { getCurrentUser } from '../../services/authService';

export default function OCRScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 表单状态
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 获取用户和hooks
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid ? 1 : null;
  const { categories, expenseCategories } = useCategories(userId);
  const { createTransaction } = useTransactions(userId);

  // 请求权限
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await useCameraPermissions();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && libraryStatus === 'granted');
    })();
  }, []);

  // 从相册选择图片
  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        await processImage(imageUri);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '无法访问相册');
    }
  };

  // 拍照
  const takePhoto = async () => {
    if (!hasPermission) {
      Alert.alert('需要权限', '请授予相机和相册访问权限');
      return;
    }
    setCameraVisible(true);
  };

  // 处理拍照
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setCameraVisible(false);
        await processImage(photo.uri);
      } catch (error) {
        console.error('拍照失败:', error);
        Alert.alert('错误', '拍照失败');
      }
    }
  };

  // 处理图片
  const processImage = async (imageUri) => {
    setCapturedImage(imageUri);
    setIsProcessing(true);

    try {
      // 压缩图片
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // OCR识别
      const ocrResult = await recognizeImage(manipulatedImage.uri);
      
      if (ocrResult.success) {
        setRecognizedText(ocrResult.text);
        
        // 提取交易信息
        const info = extractTransactionInfo(ocrResult.text);
        setExtractedInfo(info);
        
        // 填充表单
        if (info.amount) setAmount(info.amount.toString());
        if (info.date) setDate(info.date);
        if (info.merchant || info.description) {
          setDescription(info.merchant || info.description || '');
        }
        
        // 自动匹配分类
        const matchedCategory = matchCategory(info.merchant || info.description || '');
        if (matchedCategory) {
          setCategoryId(matchedCategory.id);
        }

        setShowEditModal(true);
      } else {
        Alert.alert('识别失败', ocrResult.error || '无法识别图片内容');
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      Alert.alert('错误', '处理图片时出错');
    } finally {
      setIsProcessing(false);
    }
  };

  // 匹配分类
  const matchCategory = (text) => {
    const lowerText = text.toLowerCase();
    const keywords = {
      '餐饮': ['餐厅', '饭店', '美食', '外卖', '肯德基', '麦当劳', '星巴克', '奶茶', '咖啡'],
      '交通': ['地铁', '公交', '打车', '滴滴', '出租车', '加油'],
      '购物': ['超市', '便利店', '京东', '淘宝', '天猫', '商场'],
      '娱乐': ['电影', '游戏', 'KTV', '影院'],
      '医疗': ['医院', '药店', '诊所'],
    };

    for (const [categoryName, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lowerText.includes(word)) {
          return expenseCategories.find(c => c.name.includes(categoryName));
        }
      }
    }
    return null;
  };

  // 保存交易
  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }

    const transactionData = {
      amount: parseFloat(amount),
      type: 'expense',
      category_id: categoryId || null,
      date: date || new Date().toISOString().split('T')[0],
      description: description || 'OCR识别交易',
      platform: 'other',
      is_from_ocr: true,
    };

    const result = await createTransaction(transactionData);

    if (result.success) {
      Alert.alert(
        '保存成功',
        '交易已保存',
        [
          {
            text: '继续识别',
            onPress: () => {
              resetState();
            },
          },
          {
            text: '查看账单',
            onPress: () => {
              navigation.navigate('Transactions');
            },
          },
        ]
      );
    } else {
      Alert.alert('保存失败', result.error || '请重试');
    }
  };

  const resetState = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setExtractedInfo(null);
    setAmount('');
    setDate('');
    setDescription('');
    setCategoryId('');
    setShowEditModal(false);
  };

  const cameraRef = useRef(null);

  // 相机界面
  if (cameraVisible) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setCameraVisible(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              testID="capture-button"
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={styles.cameraButton} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="ocr-screen">
      {/* 主界面 */}
      {!capturedImage ? (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Ionicons name="scan-outline" size={48} color="#007AFF" />
            <Text style={styles.title}>OCR智能识别</Text>
            <Text style={styles.subtitle}>拍照或从相册导入账单截图，自动识别交易信息</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
              <View style={[styles.optionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="camera-outline" size={32} color="#007AFF" />
              </View>
              <Text style={styles.optionTitle}>拍照识别</Text>
              <Text style={styles.optionDesc}>直接拍摄发票或收据</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={pickImageFromLibrary}>
              <View style={[styles.optionIcon, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="images-outline" size={32} color="#9c27b0" />
              </View>
              <Text style={styles.optionTitle}>相册导入</Text>
              <Text style={styles.optionDesc}>从相册选择截图</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>使用提示</Text>
            <Text style={styles.tipItem}>• 确保图片清晰，文字可辨认</Text>
            <Text style={styles.tipItem}>• 支持发票、收据、账单截图</Text>
            <Text style={styles.tipItem}>• 识别后请核对信息是否正确</Text>
            <Text style={styles.tipItem}>• 支持支付宝、微信账单截图</Text>
          </View>
        </View>
      ) : (
        /* 预览界面 */
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} testID="preview-image" />
          
          {isProcessing ? (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>正在识别...</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* 编辑模态框 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>确认交易信息</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* 金额 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>金额 *</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.currency}>¥</Text>
                  <TextInput
                    style={styles.amountField}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
              </View>

              {/* 日期 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>日期</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {/* 描述 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>描述</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="交易描述"
                />
              </View>

              {/* 分类 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>分类</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => setShowCategoryModal(true)}
                >
                  {categoryId ? (
                    <Text style={styles.categoryText}>
                      {expenseCategories.find(c => c.id === categoryId)?.name || '选择分类'}
                    </Text>
                  ) : (
                    <Text style={styles.categoryPlaceholder}>选择分类</Text>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              </View>

              {/* 识别的原始文本 */}
              {recognizedText ? (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>识别内容</Text>
                  <View style={styles.recognizedTextContainer}>
                    <Text style={styles.recognizedText}>{recognizedText}</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存交易</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 分类选择模态框 */}
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
              {expenseCategories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    categoryId === category.id && styles.categoryItemActive,
                  ]}
                  onPress={() => {
                    setCategoryId(category.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon} size={20} color="#fff" />
                  </View>
                  <Text style={styles.categoryItemText}>{category.name}</Text>
                  {categoryId === category.id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cameraButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
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
    maxHeight: '80%',
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
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
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  recognizedTextContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    maxHeight: 100,
  },
  recognizedText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});
