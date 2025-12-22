function muLawDecode(muLawBuffer) {
  const pcm = Buffer.alloc(muLawBuffer.length * 2);

  for (let i = 0; i < muLawBuffer.length; i++) {
    pcm.writeInt16LE(decodeSample(muLawBuffer[i]), i * 2);
  }

  return pcm;
}

function decodeSample(muLawByte) {
  muLawByte = ~muLawByte;
  const sign = muLawByte & 0x80;
  const exponent = (muLawByte >> 4) & 0x07;
  const mantissa = muLawByte & 0x0f;
  let sample = ((mantissa << 1) + 1) << (exponent + 2);
  return sign ? -sample : sample;
}

function linear2ulaw(sample) {
  const BIAS = 0x84;
  const CLIP = 32635;
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample = sample + BIAS;
  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--) {
    expMask >>= 1;
  }
  let mantissa = (sample >> (exponent + 3)) & 0x0F;
  let out = (sign | (exponent << 4) | mantissa);
  return ~out;
}

function pcm16ToMuLaw(pcmBuffer) {
  const muLaw = Buffer.alloc(pcmBuffer.length / 2);
  for (let i = 0; i < pcmBuffer.length; i += 2) {
    const sample = pcmBuffer.readInt16LE(i);
    muLaw[i / 2] = linear2ulaw(sample);
  }
  return muLaw;
}

module.exports = { 
  muLawDecode,
  pcm16ToMuLaw
};
