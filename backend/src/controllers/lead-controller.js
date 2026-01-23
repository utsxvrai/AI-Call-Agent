const supabase = require('../services/supabase-service');
const { v4: uuidv4 } = require('uuid');

const createBatch = async (req, res) => {
    try {
        const { leads } = req.body;

        if (!leads || !Array.isArray(leads)) {
            return res.status(400).json({ error: 'Invalid leads data' });
        }

        // 1. Create a batch record
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .insert([{ id: uuidv4() }])
            .select()
            .single();

        if (batchError) throw batchError;

        // 2. Prepare leads with batch_id
        const leadsToInsert = leads.map(lead => ({
            id: uuidv4(),
            batch_id: batch.id,
            name: lead.name,
            number: lead.number,
            description: lead.description || '',
            call_status: 'pending',
            is_interested: null
        }));

        // 3. Insert leads in chunks to avoid large request issues if needed, but for now insert all
        const { error: leadsError } = await supabase
            .from('leads')
            .insert(leadsToInsert);

        if (leadsError) throw leadsError;

        res.status(201).json({
            message: 'Batch created successfully',
            batchId: batch.id,
            count: leadsToInsert.length
        });
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ error: 'Failed to create lead batch', details: error.message });
    }
};

const getBatches = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('batches')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform for frontend if needed (frontend expects batch.date)
        const formattedBatches = data.map(b => ({
            id: b.id,
            date: b.created_at,
            name: b.name || `Outreach ${new Date(b.created_at).toLocaleDateString()}`
        }));

        res.status(200).json(formattedBatches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
};

const getLeads = async (req, res) => {
    try {
        const { batch_id } = req.query;

        let query = supabase.from('leads').select('*');

        if (batch_id) {
            query = query.eq('batch_id', batch_id);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};

const deleteBatch = async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID is required' });
        }

        console.log(`[DELETE] Deleting batch: ${batchId}`);

        // 1. Delete all leads for this batch
        const { error: leadsError } = await supabase
            .from('leads')
            .delete()
            .eq('batch_id', batchId);

        if (leadsError) throw leadsError;

        // 2. Delete the batch record
        const { error: batchError } = await supabase
            .from('batches')
            .delete()
            .eq('id', batchId);

        if (batchError) throw batchError;

        res.status(200).json({ message: 'Batch and associated leads deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({ error: 'Failed to delete batch', details: error.message });
    }
};

module.exports = {
    createBatch,
    getBatches,
    getLeads,
    deleteBatch
};
