# SkillGarden Sponsor Integration

Every sponsor has a structural, non-removable role. Remove any one and the product breaks.

---

## Integration Map

| Sponsor | Role | Phase | Why It's Essential |
|---------|------|-------|--------------------|
| **BizCrush** | Captures panels, lectures, conversations in noisy environments | Ingest | Without it, audio sources can't enter the pipeline |
| **Anthropic (Claude)** | Extracts claims, generates assessments, evaluates responses, adaptive difficulty | Process + Test | The reasoning backbone of every feature |
| **White Circle AI** | Truth Gate - validates sources, claims, and AI fidelity | Validate | Without it, users learn from unverified/incorrect content |
| **Perle** | Human experts review uncertain claims and grade high-level assessments | Validate + Certify | AI alone can't handle edge cases or certify mastery |
| **ElevenLabs** | Voice recaps, Socratic debate agent, teach-back evaluation | Deliver + Test | Voice is the highest-fidelity mastery assessment |
| **Blaxel** | Persistent sandboxes - knowledge graph, skill trees, XP tracking | Store + Track | Without persistence, no progress tracking or spaced repetition |
| **Finny** | Content prospecting - recommends sources targeting knowledge gaps | Recommend | Without it, users wander instead of targeting weaknesses |
| **Lovable** | Builds the full-stack app | Interface | The user-facing layer |

---

## Detailed Role Per Feature

### Feature: Content Ingestion (US1)

| Tool | Specific Role |
|------|--------------|
| BizCrush | Captures audio from panels, lectures, noisy environments |
| Anthropic | Processes transcript, extracts discrete claims, attributes speakers, segments topics |
| White Circle AI | Validates every extracted claim before it enters the knowledge graph |
| Perle | Routes uncertain claims (trust score < threshold) to human expert reviewers |
| Blaxel | Stores verified claims in persistent per-user knowledge graph |
| ElevenLabs | Generates personalized 2-min audio recap of verified content |
| Finny | Recommends related verified articles based on ingested content |
| Lovable | Content ingestion UI (paste article, upload audio, enter URL) |

### Feature: Mastery Testing (US2)

| Tool | Specific Role |
|------|--------------|
| Anthropic | Generates Bloom's-leveled questions, evaluates open-ended responses, adaptive difficulty |
| White Circle AI | Validates quiz questions are fair, unbiased, and test the claimed concept |
| ElevenLabs | Voice-based quizzing, Socratic dialogue agent, teach-back evaluation |
| BizCrush | Captures user's spoken responses in any environment |
| Perle | Human experts score ambiguous responses, validate AI-generated questions |
| Blaxel | Persistent learning state: spaced repetition schedules, mastery levels per concept |
| Finny | Recommends content targeting specific knowledge gaps revealed by assessments |
| Lovable | Quiz interface, progress dashboard, audio player |

### Feature: Conflicting Source Validation (US3)

| Tool | Specific Role |
|------|--------------|
| White Circle AI | Classifies conflicts as ERROR vs LEGITIMATE DEBATE, validates evidence strength per perspective |
| Anthropic | Structures debates: arguments, evidence, strengths, weaknesses, common ground, tensions |
| ElevenLabs | Socratic debate partner, takes opposing positions, pushes user to defend under pressure |
| BizCrush | Captures user's spoken debate responses clearly |
| Perle | Human experts review when White Circle can't determine error vs debate |
| Blaxel | Stores debate clusters as multi-node structures in knowledge graph, tracks per-perspective mastery |
| Finny | Prospects additional sources to strengthen underrepresented perspectives |
| Lovable | Debate visualization UI, perspective coverage dashboard |

### Feature: Skill Trees (US4)

| Tool | Specific Role |
|------|--------------|
| Anthropic | Maps content to skill nodes, generates prerequisite-appropriate assessments |
| White Circle AI | Validates content-to-skill mapping accuracy, ensures XP isn't inflated for tangential content |
| Perle | Human curriculum designers validate skill tree structure |
| ElevenLabs | Delivers lessons in preferred learning style (audio), voice-based gate assessments |
| BizCrush | Captures lecture/panel content and maps to correct skill nodes |
| Blaxel | Persistent skill tree state, learning style detection, prerequisite enforcement engine |
| Finny | Prospects content targeting user's exact next milestone |
| Lovable | Skill tree visualization, progress map, gate challenge UI |

### Feature: Credentialing (US5)

| Tool | Specific Role |
|------|--------------|
| Anthropic | Generates tier-appropriate assessments, evaluates responses, adapts difficulty to level |
| White Circle AI | Validates assessment integrity, ensures no question leakage, audits AI grading |
| Perle | Human expert evaluation for Level 86+, validates Grandmaster responses |
| ElevenLabs | Voice-based assessments at Expert+ tiers, adversarial questioning |
| BizCrush | Captures voice assessment responses in any environment |
| Blaxel | Persistent XP tracking, skill decay monitoring, level calculations |
| Finny | Recommends content targeted at level boundary |
| Lovable | Skill dashboard, XP progress bars, credential cards, CV export |

---

## Sponsor Shoutout (For Pitch)

"Every sponsor is structurally essential to SkillGarden:"

- "BizCrush captures the real world."
- "Anthropic thinks about it."
- "White Circle AI makes sure it's true."
- "Perle brings humans into the loop."
- "ElevenLabs gives it a voice."
- "Blaxel remembers everything."
- "Finny finds what you need next."
- "Lovable makes it beautiful."
