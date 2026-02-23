const axios = require('axios');
require('dotenv').config();

const WhatsAppService = {
  /**
   * Sends a WhatsApp template message using Meta Cloud API
   * @param {string} to - Recipient phone number in E.164 format
   * @param {string} leadName - Name of the lead for template personalization
   * @param {string} productLink - Link to be included in the message
   */
  async sendTemplateMessage(to, leadName = 'there', productLink = '') {
    const {
      META_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_TEMPLATE_NAME
    } = process.env;

    if (!META_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TEMPLATE_NAME) {
      console.error('❌ [WHATSAPP] Missing Meta Cloud API credentials in .env');
      return { success: false, error: 'Missing credentials' };
    }

    // Ensure number is in E.164 format (remove any non-digits except +)
    let formattedNumber = to.replace(/[^\d+]/g, '');
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = `+${formattedNumber}`;
    }
    // Meta API expects number without '+' for the 'to' field in some cases, 
    // but usually E.164 with the plus is fine or just digits.
    // Let's use digits only as it's safer for Meta's 'to' field.
    const cleanNumber = formattedNumber.replace('+', '');

    console.log(`[WHATSAPP] Attempting to send message to: ${cleanNumber}`);

    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: cleanNumber,
      type: "template",
      template: {
        name: WHATSAPP_TEMPLATE_NAME,
        language: {
          code: "en_US"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: leadName
              },
              {
                type: "text",
                text: productLink || process.env.BASE_URL || "our website"
              }
            ]
          }
        ]
      }
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ [WHATSAPP] Message sent successfully to ${cleanNumber}. ID: ${response.data.messages[0].id}`);
      return { success: true, data: response.data };
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      console.error(`❌ [WHATSAPP] Failed to send message:`, errorData.message || error.message);
      return { 
        success: false, 
        error: errorData.message || error.message,
        details: errorData
      };
    }
  }
};

module.exports = WhatsAppService;
