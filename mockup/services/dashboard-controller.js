// SkillGarden Dashboard Controller
// Wires together all services into a functional dashboard
// Transforms the static HTML mockup into a live app

document.addEventListener('DOMContentLoaded', () => {

  // --- Initialize Services ---
  const sb = initSupabase();
  speechAvailable = initSpeechRecognition();

  console.log('[SkillGarden] Dashboard initializing...');
  console.log('[SkillGarden] Supabase:', sb ? 'connected' : 'demo mode');
  console.log('[SkillGarden] Speech:', speechAvailable ? 'available' : 'unavailable');
  console.log('[SkillGarden] Claude:', CONFIG.anthropic.apiKey ? 'configured' : 'demo mode');
  console.log('[SkillGarden] ElevenLabs:', CONFIG.elevenlabs.apiKey ? 'configured' : 'demo mode');
  console.log('[SkillGarden] White Circle:', CONFIG.whitecircle.apiKey ? 'configured' : 'demo mode');
  console.log('[SkillGarden] Blaxel:', CONFIG.blaxel.apiKey ? 'configured' : 'demo mode');

  // --- Wire Up Quiz Tab ---
  wireQuizTab();

  // --- Wire Up Voice Tab ---
  wireVoiceTab();

  // --- Wire Up Claim Validation ---
  wireClaimValidation();

  // --- Wire Up Open Response ---
  wireOpenResponse();

  // --- Wire Up Decay Reinforcement ---
  wireDecayActions();

  // --- Wire Up Debate Challenge ---
  wireDebateChallenge();
});

// === QUIZ TAB ===

function wireQuizTab() {
  // Make assessment options actually clickable and scoreable
  document.querySelectorAll('.assessment-option').forEach(option => {
    option.addEventListener('click', async function () {
      const card = this.closest('.assessment-card');
      const options = card.querySelectorAll('.assessment-option');
      const feedback = card.querySelector('.quiz-feedback');
      const isCorrect = this.classList.contains('correct');

      // Disable all options
      options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.classList.contains('correct')) {
          opt.style.background = 'rgba(67, 160, 71, 0.15)';
          opt.style.borderColor = 'var(--verified)';
        }
      });

      if (!isCorrect) {
        this.style.background = 'rgba(211, 47, 47, 0.15)';
        this.style.borderColor = '#D32F2F';
      }

      // Show feedback
      if (feedback) {
        feedback.style.display = 'block';
        if (!isCorrect) {
          feedback.classList.remove('correct-feedback');
          feedback.classList.add('incorrect-feedback');
          feedback.querySelector('.feedback-text').textContent =
            'Incorrect. Review the EU AI Act classification framework in Skill Tree > Frameworks tier.';
          feedback.querySelector('.feedback-xp').textContent = '+0 XP';
        }
      }

      // Award XP if correct
      if (isCorrect) {
        const xpGain = 25;
        await awardXP(xpGain, 'skill-ai-finance');
        showXPToast(xpGain);
      }
    });
  });

  // Add "Generate New Question" button after existing quiz cards
  const quizGrid = document.querySelector('#tab-quiz .assessments-grid');
  if (quizGrid) {
    const genBtn = document.createElement('div');
    genBtn.className = 'assessment-card';
    genBtn.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; border: 2px dashed var(--border);';
    genBtn.innerHTML = `
      <div style="text-align: center; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">+</div>
        <div style="font-size: 0.85rem; font-weight: 600;">Generate New Question</div>
        <div style="font-size: 0.75rem; margin-top: 4px;">Powered by Anthropic Claude</div>
      </div>
    `;
    genBtn.addEventListener('click', () => generateNewQuestion(quizGrid, genBtn));
    quizGrid.appendChild(genBtn);
  }
}

async function generateNewQuestion(container, triggerBtn) {
  triggerBtn.innerHTML = '<div style="text-align: center; color: var(--text-muted);"><div class="spinner"></div><div style="font-size: 0.85rem; margin-top: 8px;">Generating via Claude...</div></div>';
  triggerBtn.style.pointerEvents = 'none';

  const user = DEMO_DATA.user;
  const skill = DEMO_DATA.skills[0]; // AI Boom in Finance
  const subTopic = skill.sub_nodes[Math.floor(Math.random() * skill.sub_nodes.length)].name;

  const question = await generateQuestion(skill.name, subTopic, skill.level);

  // Build the question card
  const card = document.createElement('div');
  card.className = 'assessment-card';

  if (question.type === 'multiple_choice') {
    card.innerHTML = `
      <div class="assessment-header">
        <span class="assessment-type">${skill.name}</span>
        <span class="assessment-bloom">Bloom L${question.bloom_level}: ${question.bloom_name}</span>
      </div>
      <div class="assessment-body">
        <div class="assessment-question">${question.question}</div>
        <div class="assessment-options">
          ${question.options.map((opt, i) =>
            `<div class="assessment-option${i === question.correct_index ? ' correct' : ''}" role="button" tabindex="0">${opt}</div>`
          ).join('')}
        </div>
        <div class="quiz-feedback correct-feedback" style="margin-top: var(--space-md); display: none;">
          <div class="feedback-text">${question.rubric}</div>
          <div class="feedback-xp">+${question.xp_reward} XP</div>
        </div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="assessment-header">
        <span class="assessment-type">${skill.name}</span>
        <span class="assessment-bloom">Bloom L${question.bloom_level}: ${question.bloom_name}</span>
      </div>
      <div class="assessment-body">
        <div class="assessment-question">${question.question}</div>
        <textarea class="open-response-input" placeholder="Type your response here..." style="width: 100%; min-height: 120px; padding: var(--space-md); border: 2px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 0.9rem; resize: vertical; background: var(--canvas);"></textarea>
        <button class="submit-response-btn" style="margin-top: var(--space-sm); padding: 8px 20px; background: var(--deep-forest); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">Submit for Evaluation</button>
        <div class="evaluation-result" style="display: none; margin-top: var(--space-md);"></div>
      </div>
    `;
  }

  container.insertBefore(card, triggerBtn);

  // Re-wire the new card's options
  card.querySelectorAll('.assessment-option').forEach(option => {
    option.addEventListener('click', async function () {
      const options = card.querySelectorAll('.assessment-option');
      const feedback = card.querySelector('.quiz-feedback');
      const isCorrect = this.classList.contains('correct');

      options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.classList.contains('correct')) {
          opt.style.background = 'rgba(67, 160, 71, 0.15)';
          opt.style.borderColor = 'var(--verified)';
        }
      });

      if (!isCorrect) {
        this.style.background = 'rgba(211, 47, 47, 0.15)';
        this.style.borderColor = '#D32F2F';
      }

      if (feedback) {
        feedback.style.display = 'block';
        if (!isCorrect) {
          feedback.classList.remove('correct-feedback');
          feedback.classList.add('incorrect-feedback');
          feedback.querySelector('.feedback-xp').textContent = '+0 XP';
        }
      }

      if (isCorrect) {
        await awardXP(question.xp_reward, 'skill-ai-finance');
        showXPToast(question.xp_reward);
      }
    });
  });

  // Wire submit button for open-response
  const submitBtn = card.querySelector('.submit-response-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const textarea = card.querySelector('.open-response-input');
      const resultDiv = card.querySelector('.evaluation-result');
      const response = textarea.value.trim();
      if (!response) return;

      submitBtn.textContent = 'Evaluating via Claude + White Circle...';
      submitBtn.disabled = true;

      const evaluation = await evaluateResponse(question.question, response, skill.name, skill.level);

      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="background: var(--canvas); border-radius: var(--radius-md); padding: var(--space-lg);">
          <div style="display: flex; gap: var(--space-lg); margin-bottom: var(--space-md);">
            <div style="text-align: center;">
              <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; color: var(--tier-expert);">${evaluation.overall}%</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Overall</div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.accuracy || 0}%</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Accuracy</div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.completeness || 0}%</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Complete</div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.depth || 0}%</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Depth</div>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${evaluation.feedback}</div>
          ${evaluation.gaps?.length ? `<div style="margin-top: var(--space-sm); font-size: 0.8rem; color: #D32F2F;">Gaps: ${evaluation.gaps.join(', ')}</div>` : ''}
          <div style="margin-top: var(--space-sm); font-family: var(--font-mono); font-size: 0.85rem; color: var(--verified);">+${evaluation.xp_reward} XP</div>
        </div>
      `;

      if (evaluation.xp_reward > 0) {
        await awardXP(evaluation.xp_reward, 'skill-ai-finance');
        showXPToast(evaluation.xp_reward);
      }
    });
  }

  // Reset trigger button
  triggerBtn.innerHTML = `
    <div style="text-align: center; color: var(--text-muted);">
      <div style="font-size: 2rem; margin-bottom: 8px;">+</div>
      <div style="font-size: 0.85rem; font-weight: 600;">Generate Another</div>
      <div style="font-size: 0.75rem; margin-top: 4px;">Powered by Anthropic Claude</div>
    </div>
  `;
  triggerBtn.style.pointerEvents = 'auto';
}

// === VOICE TAB ===

function wireVoiceTab() {
  const voiceTab = document.getElementById('tab-voice');
  if (!voiceTab) return;

  // Add a "Start Recording" button
  const prompt = voiceTab.querySelector('.voice-prompt');
  if (!prompt) return;

  const recordBtn = document.createElement('button');
  recordBtn.className = 'voice-record-btn';
  recordBtn.style.cssText = `
    display: block; width: 100%; margin-top: var(--space-md);
    padding: 12px 24px; background: var(--deep-forest); color: white;
    border: none; border-radius: var(--radius-md); cursor: pointer;
    font-weight: 600; font-size: 0.9rem;
  `;
  recordBtn.textContent = speechAvailable
    ? 'Start Voice Assessment'
    : 'Voice requires Chrome/Edge';
  recordBtn.disabled = !speechAvailable;

  let recording = false;
  let liveTranscript = null;

  recordBtn.addEventListener('click', () => {
    if (!recording) {
      recording = true;
      recordBtn.textContent = 'Stop Recording';
      recordBtn.style.background = '#D32F2F';

      // Add live transcript area
      if (!liveTranscript) {
        liveTranscript = document.createElement('div');
        liveTranscript.style.cssText = 'margin-top: var(--space-md); padding: var(--space-md); background: var(--canvas); border-radius: var(--radius-md); font-size: 0.85rem; min-height: 60px; color: var(--text-secondary);';
        liveTranscript.textContent = 'Listening...';
        prompt.parentElement.insertBefore(liveTranscript, recordBtn.nextSibling);
      }

      startVoiceRecording(
        (data) => {
          liveTranscript.innerHTML = `<span style="color: var(--text-primary);">${data.final}</span> <span style="color: var(--text-muted); font-style: italic;">${data.interim}</span>`;
        },
        async (result) => {
          recording = false;
          recordBtn.textContent = 'Evaluating...';
          recordBtn.disabled = true;

          // Evaluate via Claude
          const evaluation = await evaluateResponse(
            prompt.textContent,
            result.transcript,
            'AI Boom in Finance',
            76
          );

          // Update the voice scores in the existing UI
          const scores = voiceTab.querySelectorAll('.voice-score-value');
          if (scores.length >= 3) {
            scores[0].textContent = `${evaluation.scores?.accuracy || 0}%`;
            scores[1].textContent = `${evaluation.scores?.completeness || 0}%`;
            scores[2].textContent = `${evaluation.scores?.clarity || 0}%`;
          }

          // Update feedback
          const feedbackSections = voiceTab.querySelectorAll('.voice-feedback-section');
          if (feedbackSections.length >= 2) {
            const correctItems = feedbackSections[0].querySelector('.voice-fb-items');
            const gapItems = feedbackSections[1].querySelector('.voice-fb-items');
            if (correctItems && evaluation.correct_points) {
              correctItems.innerHTML = evaluation.correct_points.map(p => `<span>${p}</span>`).join('');
            }
            if (gapItems && evaluation.gaps) {
              gapItems.innerHTML = evaluation.gaps.map(g => `<span>${g}</span>`).join('');
            }
          }

          liveTranscript.innerHTML = `<strong>Your response (${result.duration}s, ${result.wordCount} words):</strong><br>${result.transcript}`;

          recordBtn.textContent = 'Start New Assessment';
          recordBtn.style.background = 'var(--deep-forest)';
          recordBtn.disabled = false;

          if (evaluation.xp_reward > 0) {
            await awardXP(evaluation.xp_reward, 'skill-ai-finance');
            showXPToast(evaluation.xp_reward);
          }
        }
      );
    } else {
      stopVoiceRecording();
    }
  });

  prompt.parentElement.insertBefore(recordBtn, prompt.nextSibling);
}

// === CLAIM VALIDATION ===

function wireClaimValidation() {
  // Add "Validate New Claim" input to capture section
  const captureSection = document.getElementById('capture');
  if (!captureSection) return;

  const captureBody = captureSection.querySelector('.capture-body');
  if (!captureBody) return;

  const claimInput = document.createElement('div');
  claimInput.style.cssText = 'margin-top: var(--space-lg); padding-top: var(--space-lg); border-top: 1px solid var(--border);';
  claimInput.innerHTML = `
    <h4 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: var(--space-md);">Validate a Claim</h4>
    <div style="display: flex; gap: var(--space-sm);">
      <input type="text" class="claim-input" placeholder="Enter a claim to fact-check..." style="flex: 1; padding: 10px 14px; border: 2px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 0.85rem; background: var(--canvas);">
      <button class="validate-claim-btn" style="padding: 10px 20px; background: var(--deep-forest); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; white-space: nowrap;">Validate</button>
    </div>
    <div class="claim-result" style="display: none; margin-top: var(--space-md);"></div>
    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">Powered by White Circle AI + Anthropic Claude</div>
  `;
  captureBody.appendChild(claimInput);

  const input = claimInput.querySelector('.claim-input');
  const btn = claimInput.querySelector('.validate-claim-btn');
  const result = claimInput.querySelector('.claim-result');

  btn.addEventListener('click', async () => {
    const claim = input.value.trim();
    if (!claim) return;

    btn.textContent = 'Validating...';
    btn.disabled = true;

    const validation = await validateClaim(claim);

    const statusClass = validation.verified ? 'verified' : 'unverified';
    const statusIcon = validation.verified ? '&#10003;' : '!';
    const statusText = validation.status || (validation.verified ? 'Verified' : 'Unverified');

    result.style.display = 'block';
    result.innerHTML = `
      <div class="claim-item" style="margin: 0;">
        <div class="claim-status ${statusClass}">${statusIcon}</div>
        <div>
          <div class="claim-text">"${claim}"</div>
          <div class="claim-detail">
            ${statusText} (${Math.round((validation.confidence || 0) * 100)}% confidence)
            ${validation.nuance ? ` -- ${validation.nuance}` : ''}
            ${validation.evidence ? `<br><span style="color: var(--text-muted); font-size: 0.75rem;">${validation.evidence}</span>` : ''}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">via ${validation.provider}</div>
        </div>
      </div>
    `;

    // Save to Supabase
    await saveClaim({
      user_id: DEMO_DATA.user.id,
      text: claim,
      verified: validation.verified,
      confidence: validation.confidence,
      provider: validation.provider,
    });

    btn.textContent = 'Validate';
    btn.disabled = false;
    input.value = '';
  });

  // Also handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

// === OPEN RESPONSE ===

function wireOpenResponse() {
  // Find the open-response placeholder and make it a real textarea
  const openResponseDiv = document.querySelector('#tab-quiz .assessment-card:last-of-type .assessment-body > div[style*="dashed"]');
  if (!openResponseDiv) return;

  const card = openResponseDiv.closest('.assessment-card');
  const questionText = card.querySelector('.assessment-question').textContent;

  openResponseDiv.outerHTML = `
    <textarea class="open-response-input" placeholder="Type your analysis here..." style="width: 100%; min-height: 120px; padding: var(--space-md); border: 2px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 0.9rem; resize: vertical; background: var(--canvas);"></textarea>
    <button class="submit-open-response" style="margin-top: var(--space-sm); padding: 8px 20px; background: var(--deep-forest); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">Submit for Evaluation (Claude + White Circle)</button>
    <div class="open-response-result" style="display: none; margin-top: var(--space-md);"></div>
  `;

  const submitBtn = card.querySelector('.submit-open-response');
  const resultDiv = card.querySelector('.open-response-result');

  submitBtn.addEventListener('click', async () => {
    const textarea = card.querySelector('.open-response-input');
    const response = textarea.value.trim();
    if (!response) return;

    submitBtn.textContent = 'Evaluating...';
    submitBtn.disabled = true;

    const evaluation = await evaluateResponse(questionText, response, 'AI Boom in Finance', 76);

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div style="background: var(--canvas); border-radius: var(--radius-md); padding: var(--space-lg);">
        <div style="display: flex; gap: var(--space-lg); margin-bottom: var(--space-md); flex-wrap: wrap;">
          <div style="text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; color: var(--tier-expert);">${evaluation.overall}%</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Overall</div>
          </div>
          <div style="text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.accuracy || 0}%</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Accuracy</div>
          </div>
          <div style="text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.completeness || 0}%</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Completeness</div>
          </div>
          <div style="text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.depth || 0}%</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Depth</div>
          </div>
          <div style="text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 1rem;">${evaluation.scores?.clarity || 0}%</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Clarity</div>
          </div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-sm);">${evaluation.feedback}</div>
        ${evaluation.correct_points?.length ? `<div style="font-size: 0.8rem; color: var(--verified);">Covered: ${evaluation.correct_points.join(', ')}</div>` : ''}
        ${evaluation.gaps?.length ? `<div style="font-size: 0.8rem; color: #D32F2F; margin-top: 4px;">Gaps: ${evaluation.gaps.join(', ')}</div>` : ''}
        <div style="margin-top: var(--space-sm); font-family: var(--font-mono); font-size: 0.85rem; color: var(--verified);">+${evaluation.xp_reward} XP</div>
      </div>
    `;

    submitBtn.textContent = 'Submit Another Response';
    submitBtn.disabled = false;

    if (evaluation.xp_reward > 0) {
      await awardXP(evaluation.xp_reward, 'skill-ai-finance');
      showXPToast(evaluation.xp_reward);
    }
  });
}

// === DECAY ACTIONS ===

function wireDecayActions() {
  document.querySelectorAll('.decay-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.gap-card');
      if (card.classList.contains('gap-debate')) {
        // Steelman challenge
        btn.textContent = 'Generating challenge...';
        btn.disabled = true;

        const challenge = await generateDebateChallenge(
          'AI Boom in Finance',
          'Is AI overvalued or undervalued?',
          'undervalued',
          76
        );

        if (challenge) {
          // Switch to debate tab and show the challenge
          const debateTab = document.querySelector('[data-tab="debate"]');
          if (debateTab) debateTab.click();
          showDebateChallenge(challenge);
        }

        btn.textContent = 'Take Steelman Challenge';
        btn.disabled = false;
      } else {
        // Reinforcement quiz
        btn.textContent = 'Generating reinforcement...';
        btn.disabled = true;

        // Generate a quick reinforcement question
        const quizTab = document.querySelector('[data-tab="quiz"]');
        if (quizTab) quizTab.click();

        const quizGrid = document.querySelector('#tab-quiz .assessments-grid');
        const genBtn = quizGrid?.querySelector('[style*="dashed"]');
        if (genBtn) {
          await generateNewQuestion(quizGrid, genBtn);
        }

        btn.textContent = 'Reinforce (5-10 min)';
        btn.disabled = false;
      }
    });
  });
}

// === DEBATE CHALLENGE ===

function wireDebateChallenge() {
  const pendingItems = document.querySelectorAll('.proof-item.pending');
  pendingItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', async () => {
      item.innerHTML = '<span>Generating challenge...</span>';

      const challenge = await generateDebateChallenge(
        'AI Boom in Finance',
        'Is AI overvalued or undervalued?',
        'undervalued',
        76
      );

      if (challenge) {
        showDebateChallenge(challenge);
      }
    });
  });
}

function showDebateChallenge(challenge) {
  const debateTab = document.getElementById('tab-debate');
  if (!debateTab) return;

  // Add challenge UI
  let challengeDiv = debateTab.querySelector('.active-challenge');
  if (!challengeDiv) {
    challengeDiv = document.createElement('div');
    challengeDiv.className = 'active-challenge';
    challengeDiv.style.cssText = 'margin-top: var(--space-lg); padding: var(--space-lg); background: var(--canvas); border-radius: var(--radius-md); border-left: 4px solid var(--tier-expert);';
    debateTab.querySelector('.debate-card').appendChild(challengeDiv);
  }

  challengeDiv.innerHTML = `
    <h4 style="font-size: 0.85rem; color: var(--tier-expert); margin-bottom: var(--space-md);">Active Steelman Challenge</h4>
    <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: var(--space-md);">${challenge.challenge}</p>
    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: var(--space-md);">Position to argue: ${challenge.position_to_argue}</p>
    <textarea class="debate-response" placeholder="Make your strongest case..." style="width: 100%; min-height: 100px; padding: var(--space-md); border: 2px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 0.9rem; resize: vertical; background: white;"></textarea>
    <button class="submit-debate" style="margin-top: var(--space-sm); padding: 8px 20px; background: var(--tier-expert); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">Submit Argument</button>
    <div class="debate-result" style="display: none; margin-top: var(--space-md);"></div>
  `;

  const submitBtn = challengeDiv.querySelector('.submit-debate');
  submitBtn.addEventListener('click', async () => {
    const textarea = challengeDiv.querySelector('.debate-response');
    const response = textarea.value.trim();
    if (!response) return;

    submitBtn.textContent = 'Evaluating argument...';
    submitBtn.disabled = true;

    const evaluation = await evaluateResponse(
      challenge.challenge,
      response,
      'AI Boom in Finance',
      76
    );

    const resultDiv = challengeDiv.querySelector('.debate-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div style="padding: var(--space-md); background: white; border-radius: var(--radius-md);">
        <div style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--tier-expert); margin-bottom: var(--space-sm);">${evaluation.overall}% Argument Strength</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">${evaluation.feedback}</div>
        <div style="margin-top: var(--space-sm); font-family: var(--font-mono); color: var(--verified);">+${evaluation.xp_reward} XP</div>
      </div>
    `;

    if (evaluation.xp_reward > 0) {
      await awardXP(evaluation.xp_reward, 'skill-ai-finance');
      showXPToast(evaluation.xp_reward);
    }
  });
}

// === UTILITIES ===

let speechAvailable = false;

async function awardXP(amount, skillId) {
  const result = await updateSkillXP(DEMO_DATA.user.id, skillId, amount);
  if (result?.leveledUp) {
    showLevelUpToast(result.level);
  }
}

function showXPToast(amount) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: var(--deep-forest); color: var(--verified);
    padding: 12px 24px; border-radius: var(--radius-md);
    font-family: var(--font-mono); font-weight: 700; font-size: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    animation: slideUp 0.3s ease-out;
  `;
  toast.textContent = `+${amount} XP`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function showLevelUpToast(newLevel) {
  const tier = getTierForLevel(newLevel);
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;
    background: var(--deep-forest); color: white;
    padding: 24px 48px; border-radius: var(--radius-lg);
    text-align: center;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
    animation: scaleIn 0.3s ease-out;
  `;
  toast.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 8px;">Level Up!</div>
    <div style="font-family: var(--font-mono); font-size: 1.5rem; color: ${tier.color};">Level ${newLevel}</div>
    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 4px;">${tier.name}</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
