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


module.exports = {
    startCall,
    callTwiml
}