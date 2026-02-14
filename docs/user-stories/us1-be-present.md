# User Story 1: Be Present, Learn Everything

**As a** panel attendee,
**I want to** fully experience the panel without worrying about notes,
**So that** I get both the human experience AND verified, structured knowledge afterward.

---

## The Problem

You're at a panel. Three experts are debating AI regulation. You're:
- Scribbling notes -> missing the energy, body language, follow-up questions
- Putting your phone away to be present -> losing the key insights
- Trying to do both -> doing neither well

**You shouldn't have to choose between learning and living.**

---

## The Flow

### During the Panel

User opens SkillGarden -> hits "Capture" -> puts phone in pocket.

**BizCrush** captures the full panel audio, even in noisy, crowded rooms, handling multiple speakers.

User is fully present. Laughing. Asking questions. Making eye contact. Being human.

### After the Panel (5 min later)

1. **Anthropic (Claude)** processes the transcript:
   - Key claims extracted
   - Speaker attribution
   - Topic segmentation
   - "The 5 things that matter"

2. **White Circle AI** validates:
   - Are the speakers' claims accurate?
   - Any misleading statistics?
   - Bias detection in the AI summary

3. **Perle** routes low-confidence claims to human expert reviewers, building labeled training data

4. **ElevenLabs** generates a 2-min audio recap:
   - "Here's what you learned today..."
   - Listen on the walk to the next session

5. **Blaxel** persists to user's knowledge profile:
   - Links to past panels attended
   - Builds personal knowledge graph
   - Agent monitors speakers' future work

6. **Finny** recommends next:
   - "Based on this panel, read these 3 articles"
   - "This speaker wrote a paper on X"
   - Matches user's knowledge gaps

7. **Lovable** delivers:
   - Clean panel summary card
   - Verified vs. unverified claims
   - Audio recap player
   - "Go deeper" recommendations

---

## What the User Gets Back

```
+---------------------------------------------+
| AI Regulation Panel -- Feb 14, 2026          |
| Columbia Business School                     |
|                                              |
| [play] Listen to 2-min recap                 |
|                                              |
| KEY CLAIMS                                   |
| [check] "EU AI Act applies to US companies"  |
|   -- Verified (3 sources)                    |
|                                              |
| [warn] "90% of startups will need to         |
|   comply by 2027"                            |
|   -- Unverified (sent for review)            |
|                                              |
| [check] "Open source models are exempt       |
|   under certain conditions"                  |
|   -- Verified with nuance (see details)      |
|                                              |
| GO DEEPER                                    |
| -> EU AI Act Full Text                       |
| -> Speaker's recent paper on compliance      |
| -> Related panel from TechCrunch 2025        |
+---------------------------------------------+
```

---

## Tool Integration Summary

| Tool | Role |
|------|------|
| BizCrush | Captures panel audio in noisy environment |
| Anthropic | Processes transcript, extracts claims, attributes speakers |
| White Circle AI | Validates every claim before it enters knowledge graph |
| Perle | Human review for uncertain claims |
| ElevenLabs | Generates personalized audio recap |
| Blaxel | Persists to knowledge graph, links to history |
| Finny | Recommends related content based on gaps |
| Lovable | Panel summary card UI, audio player, recommendations |
