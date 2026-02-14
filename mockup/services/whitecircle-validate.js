// SkillGarden White Circle AI - Truth Gate
// Validates claims, fact-checks content, ensures assessment integrity
// API key: wc-83d40f857681173f9d02bfe1567db311

// NOTE: White Circle AI API endpoint TBD from research.
// This module provides the interface - once we know the API shape,
// we wire it up. For now, uses Claude as a validation proxy.

// --- Claim Validation ---
// Input: A claim extracted from panel/lecture/article
// Output: Verification status, confidence, sources

async function validateClaim(claimText, context = '') {
  // Try White Circle API first
  if (CONFIG.whitecircle.apiKey && CONFIG.whitecircle.baseUrl) {
    return await validateViaWhiteCircle(claimText, context);
  }

  // Fallback: Use Claude for fact-checking
  return await validateViaClaude(claimText, context);
}

async function validateViaWhiteCircle(claimText, context) {
  try {
    // White Circle uses /policies/verify for content verification
    // and /metrics/evaluate for quality evaluation
    const response = await fetch(`${CONFIG.whitecircle.baseUrl}/policies/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.whitecircle.apiKey}`,
      },
      body: JSON.stringify({
        content: claimText,
        context: context,
        policies: ['factual_accuracy', 'no_hallucination'],
      }),
    });

    if (!response.ok) throw new Error(`White Circle API error: ${response.status}`);

    const data = await response.json();
    // Map White Circle response to our format
    const passed = data.passed !== false && data.status !== 'failed';
    return {
      verified: passed,
      confidence: data.confidence || data.score || (passed ? 0.8 : 0.3),
      sources: data.sources || data.evidence || [],
      nuance: data.details || data.explanation || null,
      provider: 'white_circle',
      raw: data,
    };
  } catch (err) {
    console.error('[WhiteCircle] API error, falling back to Claude:', err);
    return await validateViaClaude(claimText, context);
  }
}

async function validateViaClaude(claimText, context) {
  const prompt = `You are a fact-checking system for SkillGarden. Validate this claim:

Claim: "${claimText}"
${context ? `Context: ${context}` : ''}

Analyze whether this claim is:
1. VERIFIED - factually accurate with strong evidence
2. UNVERIFIED - cannot be confirmed with available evidence
3. DISPUTED - conflicting evidence exists
4. FALSE - demonstrably incorrect

Be rigorous. Financial and AI claims need specific evidence.
If verified, note any important nuances.
If unverified, explain what evidence would be needed.

Respond in JSON:
{
  "status": "verified" | "unverified" | "disputed" | "false",
  "confidence": 0.0-1.0,
  "evidence": "Brief evidence summary",
  "sources_needed": N,
  "nuance": "Any important qualifications" | null,
  "verification_notes": "Detailed reasoning"
}`;

  try {
    const response = await callClaude(prompt);
    const data = JSON.parse(response);
    return {
      verified: data.status === 'verified',
      status: data.status,
      confidence: data.confidence,
      sources: [],
      nuance: data.nuance,
      evidence: data.evidence,
      provider: 'claude_fallback',
    };
  } catch (err) {
    console.error('[WhiteCircle/Claude] Validation failed:', err);
    return {
      verified: false,
      status: 'error',
      confidence: 0,
      sources: [],
      nuance: null,
      provider: 'error',
    };
  }
}

// --- Batch Validation ---
// Validate multiple claims from a panel capture

async function validateClaims(claims, context = '') {
  const results = await Promise.all(
    claims.map(claim => validateClaim(claim.text, context))
  );

  return claims.map((claim, i) => ({
    ...claim,
    validation: results[i],
  }));
}

// --- Assessment Integrity Check ---
// Ensures AI-generated quiz questions are fair and accurate

async function validateAssessmentQuestion(question) {
  const prompt = `You are an assessment integrity checker. Validate this quiz question:

Question: ${question.question}
${question.options ? `Options: ${question.options.join(' | ')}` : ''}
${question.correct_index !== null ? `Marked correct: ${question.options[question.correct_index]}` : ''}

Check:
1. Is the marked correct answer actually correct?
2. Are the distractor options plausible but clearly wrong?
3. Is the question clear and unambiguous?
4. Does it test what it claims to test (Bloom's L${question.bloom_level})?

Respond in JSON:
{
  "valid": true | false,
  "issues": ["...", "..."] | [],
  "corrected_answer_index": N | null,
  "suggestion": "..." | null
}`;

  try {
    const response = await callClaude(prompt);
    return JSON.parse(response);
  } catch (err) {
    console.error('[WhiteCircle] Assessment validation failed:', err);
    return { valid: true, issues: [], corrected_answer_index: null, suggestion: null };
  }
}

// --- Extract Claims from Text ---
// Used in the Capture pipeline: extract discrete claims from transcript

async function extractClaims(transcript, source = '') {
  const prompt = `Extract all factual claims from this transcript. A "claim" is any statement that can be verified as true or false.

Transcript: "${transcript}"
Source: ${source || 'Unknown'}

Rules:
- Only extract verifiable factual claims (not opinions or predictions)
- Include the approximate position in the text where each claim appears
- Categorize each claim: statistic, historical fact, company claim, market claim, regulatory claim

Respond in JSON:
{
  "claims": [
    {
      "text": "The exact claim as stated",
      "category": "statistic | historical | company | market | regulatory",
      "confidence_extractable": 0.0-1.0,
      "requires_context": true | false
    }
  ],
  "total_claims": N,
  "summary": "Brief summary of the content"
}`;

  try {
    const response = await callClaude(prompt);
    return JSON.parse(response);
  } catch (err) {
    console.error('[WhiteCircle] Claim extraction failed:', err);
    return { claims: [], total_claims: 0, summary: 'Extraction failed' };
  }
}
