// SkillGarden ElevenLabs Voice Service
// Handles: Text-to-Speech (audio recaps), Speech-to-Text (voice assessments)

// --- Text-to-Speech ---
// Used for: Audio recaps of panel captures, reading assessment questions aloud

async function textToSpeech(text, voiceId) {
  if (!CONFIG.elevenlabs.apiKey) {
    console.warn('[ElevenLabs] No API key. Using demo mode.');
    return null;
  }

  const vid = voiceId || CONFIG.elevenlabs.voiceId;

  const response = await fetch(`${CONFIG.elevenlabs.baseUrl}/text-to-speech/${vid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': CONFIG.elevenlabs.apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[ElevenLabs] TTS error:', err);
    return null;
  }

  // Returns audio as a blob
  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

// --- Speech-to-Text ---
// Used for: Transcribing voice assessments (Feynman tests, debate responses)
// ElevenLabs doesn't have STT - we use the browser's Web Speech API as primary,
// or fallback to Anthropic for transcript analysis

let recognition = null;
let isRecording = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[Voice] Web Speech API not available. Voice assessment requires Chrome/Edge.');
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  return true;
}

// Start recording voice for assessment
function startVoiceRecording(onTranscript, onComplete) {
  if (!recognition && !initSpeechRecognition()) {
    onComplete({ error: 'Speech recognition not available' });
    return;
  }

  let fullTranscript = '';
  let startTime = Date.now();

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        fullTranscript += transcript + ' ';
      } else {
        interim = transcript;
      }
    }
    onTranscript({ final: fullTranscript.trim(), interim: interim });
  };

  recognition.onerror = (event) => {
    console.error('[Voice] Recognition error:', event.error);
    if (event.error === 'no-speech') {
      // Silence detected, keep going
      return;
    }
    onComplete({ error: event.error, transcript: fullTranscript.trim() });
  };

  recognition.onend = () => {
    if (isRecording) {
      // Auto-restart if we're still supposed to be recording
      recognition.start();
    } else {
      const duration = Math.round((Date.now() - startTime) / 1000);
      onComplete({
        transcript: fullTranscript.trim(),
        duration: duration,
        wordCount: fullTranscript.trim().split(/\s+/).length,
      });
    }
  };

  isRecording = true;
  recognition.start();
  return startTime;
}

// Stop recording
function stopVoiceRecording() {
  isRecording = false;
  if (recognition) {
    recognition.stop();
  }
}

// --- Voice Assessment Pipeline ---
// 1. User speaks (recorded via Web Speech API)
// 2. Transcript sent to Claude for evaluation
// 3. Scores returned to dashboard
// 4. Optional: ElevenLabs reads back the feedback

async function runVoiceAssessment(prompt, skillName, skillLevel, callbacks) {
  const { onStart, onTranscript, onEvaluating, onResult } = callbacks;

  onStart && onStart();

  return new Promise((resolve) => {
    startVoiceRecording(
      (data) => onTranscript && onTranscript(data),
      async (result) => {
        if (result.error) {
          resolve({ error: result.error });
          return;
        }

        onEvaluating && onEvaluating();

        // Send transcript to Claude for evaluation
        const evaluation = await evaluateResponse(
          prompt,
          result.transcript,
          skillName,
          skillLevel
        );

        const fullResult = {
          ...result,
          evaluation: evaluation,
        };

        onResult && onResult(fullResult);
        resolve(fullResult);
      }
    );
  });
}

// --- Audio Recap Generation ---
// Takes panel capture summary and generates a voice recap

async function generateAudioRecap(summaryText) {
  const audioUrl = await textToSpeech(summaryText);
  if (!audioUrl) return null;

  return {
    url: audioUrl,
    text: summaryText,
    duration: Math.round(summaryText.split(/\s+/).length / 2.5), // rough estimate: 150 WPM
  };
}
