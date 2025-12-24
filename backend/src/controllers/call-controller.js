const { CallService } = require("../services");

async function startCall(req,res){
    try{
        const { to } = req.body;
        const call = await CallService.startOutboundCall({to});
        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
        });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ error: 'Failed to start call' });
    }
}   

async function callTwiml(req,res){
    try{
        const twiml = await CallService.getGreetingTwiML();
        res.set('Content-Type', 'text/xml');
        res.send(twiml);
    }
    catch(error){
        console.error(error);
        res.status(500).json({ error: 'Failed to generate TwiML' });
    }
}

async function handleStatus(req, res) {
    const { CallSid, CallStatus } = req.body || {};
    
    if (!CallSid) {
        return res.sendStatus(200);
    }

    console.log(`📡 [${CallSid}] Twilio Status: ${CallStatus}`);

    const transcriptService = require('../services/transcript-service');
    const io = transcriptService.getIo();

    if (io) {
        io.emit('callStatus', { callSid: CallSid, status: CallStatus });
    }

    res.sendStatus(200);
}

module.exports = {
    startCall,
    callTwiml,
    handleStatus
}