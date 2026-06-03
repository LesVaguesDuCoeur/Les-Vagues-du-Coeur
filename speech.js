// SECTION: Speech Utilities
const speech = {
  _synth: window.speechSynthesis,
  _voices: [],
  _SpeechRecognition: window.SpeechRecognition || window.webkitSpeechRecognition,
  init: () => { if (speech._synth) { speech._voices = speech._synth.getVoices(); speech._synth.onvoiceschanged = () => { speech._voices = speech._synth.getVoices(); }; } },
  getEnglishVoice: () => { if (!speech._voices || speech._voices.length === 0) return null; return speech._voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')) || speech._voices[0]; },
  speak: (text, rate = 1.0, pitch = 1.0) => {
    return new Promise((resolve) => {
      if (!speech._synth) { app.showToast('Synthèse vocale non disponible sur ce navigateur.', 'error'); resolve(false); return; }
      speech._synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = speech.getEnglishVoice();
      utterance.lang = utterance.voice ? utterance.voice.lang : 'en-US';
      utterance.rate = rate; utterance.pitch = pitch;
      utterance.onend = () => resolve(true); utterance.onerror = () => resolve(false);
      speech._synth.speak(utterance);
    });
  },
  cancel: () => { if (speech._synth) speech._synth.cancel(); },
  recognize: (expectedText = null, onPartial = null) => {
    return new Promise((resolve) => {
      if (!speech._SpeechRecognition) { app.showToast('Microphone non disponible sur ce navigateur. Essayez Chrome ou Edge.', 'error'); resolve({ success: false, error: 'not_supported', transcript: '' }); return; }
      const recognition = new speech._SpeechRecognition();
      recognition.lang = 'en-US'; recognition.interimResults = !!onPartial; recognition.maxAlternatives = 1;
      let finalTranscript = '';
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } }
        if (onPartial && interimTranscript) { onPartial(interimTranscript); }
      };
      recognition.onerror = (event) => { app.playSound('error'); resolve({ success: false, error: event.error, transcript: finalTranscript }); };
      recognition.onend = () => { resolve({ success: true, transcript: finalTranscript }); };
      try { recognition.start(); } catch (e) { resolve({ success: false, error: 'start_failed', transcript: '' }); }
    });
  },
  calculatePronunciationScore: (expected, actual) => {
    if (!expected || !actual) return 0;
    const norm = (str) => str.toLowerCase().replace(/[^\w\s]/gi, '').trim().split(/\s+/);
    const expWords = norm(expected); const actWords = norm(actual);
    let matchCount = 0; expWords.forEach(ew => { if (actWords.includes(ew)) matchCount++; });
    return Math.round((matchCount / expWords.length) * 100);
  }
};
document.addEventListener('DOMContentLoaded', speech.init);
window.speech = speech;
