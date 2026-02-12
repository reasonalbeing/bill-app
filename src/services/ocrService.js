// OCR service implementation

/**
 * Recognize text from image
 * @param {string} imageUri - Image URI
 * @returns {Promise<{success: boolean, text: string, error: string}>}
 */
export const recognizeImage = async (imageUri) => {
  try {
    // In a real implementation, this would use an OCR service
    // For now, return mock data
    return {
      success: true,
      text: 'Test OCR text\nAmount: $100.00\nDate: 2024-01-01\nMerchant: Test Store',
      error: null,
    };
  } catch (error) {
    console.error('OCR recognition failed:', error);
    return {
      success: false,
      text: '',
      error: error.message,
    };
  }
};

/**
 * Extract transaction info from OCR text
 * @param {string} text - OCR recognized text
 * @returns {object} Transaction info
 */
export const extractTransactionInfo = (text) => {
  const info = {
    amount: null,
    date: null,
    merchant: null,
    description: null,
  };

  // In a real implementation, this would parse the text
  // For now, return mock data
  info.amount = 100;
  info.date = '2024-01-01';
  info.merchant = 'Test Store';
  info.description = 'Test Transaction';

  return info;
};
