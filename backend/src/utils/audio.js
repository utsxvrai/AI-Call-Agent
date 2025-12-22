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

module.exports = { muLawDecode };
