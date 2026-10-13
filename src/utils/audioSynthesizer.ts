// Generates a lightweight synthetic audio WAV data URL for demo meetings so users can test audio player features
export function createSyntheticDemoAudioUrl(durationSeconds: number = 60, title: string = 'Demo Meeting'): string {
  try {
    const sampleRate = 16000;
    const numChannels = 1;
    const numSamples = Math.floor(sampleRate * Math.min(durationSeconds, 180));
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // Write WAV Header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat PCM
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Generate gentle voice-like melodic speech harmonic simulation (formant-like oscillations with speech cadence)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Speech syllable rhythm cadence (around 3 to 4 syllables per second)
      const syllableEnvelope = Math.max(0, Math.sin(t * Math.PI * 3.5));
      // Base speech pitch ~ 160Hz with subtle pitch variation
      const pitch = 160 + Math.sin(t * 1.2) * 25 + Math.cos(t * 3.1) * 15;
      // Harmonics
      const harmonic1 = Math.sin(2 * Math.PI * pitch * t);
      const harmonic2 = 0.5 * Math.sin(2 * Math.PI * pitch * 2 * t);
      const harmonic3 = 0.25 * Math.sin(2 * Math.PI * pitch * 3 * t);
      
      // Occasional conversational pauses every 3-5 seconds
      const isSpeaking = (Math.sin(t * 0.7) > -0.2) ? 1 : 0.05;

      const sample = (harmonic1 + harmonic2 + harmonic3) * syllableEnvelope * isSpeaking * 0.18;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Could not generate synthetic demo audio:', err);
    return '';
  }
}
