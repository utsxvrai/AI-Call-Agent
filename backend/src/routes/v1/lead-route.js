const express = require('express');
const supabase = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Batch create leads
router.post('/batch', async (req, res) => {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'Leads array is required' });
    }

    const batchId = uuidv4();
    const formattedLeads = leads.map(lead => ({
      name: lead.name,
      number: lead.number,
      description: lead.description || '',
      status: 'pending',
      is_interested: false,
      batch_id: batchId
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(formattedLeads)
      .select();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Leads imported successfully', 
      count: data.length,
      batch_id: batchId 
    });
  } catch (error) {
    console.error('Error importing leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all batches (unique dates/IDs)
router.get('/batches', async (req, res) => {
  try {
    // We group by batch_id by selecting unique values
    const { data, error } = await supabase
      .from('leads')
      .select('batch_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter unique batch_ids in JS to keep it simple
    const batches = [];
    const seen = new Set();
    
    data.forEach(item => {
      if (item.batch_id && !seen.has(item.batch_id)) {
        seen.add(item.batch_id);
        batches.push({
          id: item.batch_id,
          date: item.created_at
        });
      }
    });

    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all leads (with optional batch_id filter)
router.get('/', async (req, res) => {
  try {
    const { batch_id } = req.query;
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (batch_id) {
      query = query.eq('batch_id', batch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update lead status/interest
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_interested } = req.body;

    const { data, error } = await supabase
      .from('leads')
      .update({ status, is_interested })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
