class Pcm16RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input?.[0]) {
      const f32 = input[0];
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        i16[i] = f32[i] < 0 ? f32[i] * 0x8000 : f32[i] * 0x7fff;
      }
      this.port.postMessage(i16.buffer, [i16.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm16-recorder", Pcm16RecorderProcessor);
