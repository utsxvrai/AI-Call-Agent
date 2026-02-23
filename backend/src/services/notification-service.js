const EventEmitter = require('events');
const WhatsAppService = require('./whatsapp-service');
const supabase = require('./supabase-service');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  setupListeners() {
    // Listen for call Completion events where interest was detected
    this.on('callCompleted', async (data) => {
      const { leadId, isInterested } = data;

      if (isInterested) {
        console.log(`🔔 [NOTIFICATION] Interest detected for lead ${leadId}. Queueing WhatsApp...`);
        this.processWhatsAppFollowup(leadId);
      }
    });
  }

  /**
   * Processes the WhatsApp follow-up asynchronously
   * @param {string} leadId 
   */
  async processWhatsAppFollowup(leadId) {
    try {
      // 1. Fetch lead details from Supabase
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error || !lead) {
        console.error(`❌ [NOTIFICATION] Could not fetch lead ${leadId} for WhatsApp:`, error?.message);
        return;
      }

      if (!lead.number) {
        console.error(`❌ [NOTIFICATION] Lead ${leadId} has no phone number.`);
        return;
      }

      // 2. Send the message
      // We use a default link or one from env if needed
      const productLink = process.env.PRODUCT_LINK || "https://salesence.ai"; 
      
      const result = await WhatsAppService.sendTemplateMessage(
        lead.number, 
        lead.name || 'there',
        productLink
      );

      if (result.success) {
        console.log(`✅ [NOTIFICATION] WhatsApp follow-up completed for ${lead.name}`);
      } else {
        console.error(`❌ [NOTIFICATION] WhatsApp follow-up failed for ${lead.name}:`, result.error);
      }
    } catch (err) {
      console.error(`❌ [NOTIFICATION] Error in background worker:`, err.message);
    }
  }

  /**
   * Public method to trigger notification events
   */
  triggerCallSync(leadId, isInterested) {
    this.emit('callCompleted', { leadId, isInterested });
  }
}

// Singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;
