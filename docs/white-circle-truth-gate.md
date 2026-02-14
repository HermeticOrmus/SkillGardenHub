# White Circle AI: Truth Gate

White Circle AI is the guardian of the learning pipeline. It validates content at the INGEST phase -- making sure source material is accurate before the user ever learns from it.

> You can have the best spaced repetition system in the world. If the source material is wrong, you're just efficiently memorizing lies.

---

## Position in Pipeline

White Circle sits between claim extraction (Anthropic) and the knowledge graph (Blaxel). Nothing passes without validation.

```
Source --> BizCrush (if audio) --> Anthropic (extract claims) --> WHITE CIRCLE --> Knowledge Graph
```

---

## Three Layers of Protection

### Layer 1: Source Validation

Is the source itself credible?

- Domain reputation assessment
- Publication date / freshness check
- Known bias signals
- Retraction history
- Known misinformation vector detection

### Layer 2: Claim Verification

Is this specific claim true?

- Cross-reference against trusted sources
- Detect hallucinated statistics
- Flag unsupported assertions
- Check for missing context that changes meaning
- Identify outdated data

### Layer 3: AI Fidelity

Did our AI (Claude) introduce errors during processing?

- Is the extraction faithful to the original source?
- Did summarization distort meaning?
- Were any claims added that weren't in the original?
- Are the extracted claims representative of the source?

---

## Output Classification

Each claim receives one of four statuses:

| Status | Meaning | Action |
|--------|---------|--------|
| **VERIFIED** | Claim is accurate and sourced | Enters knowledge graph, available for quizzes |
| **UNCERTAIN** | Can't determine accuracy with confidence | Routed to Perle for human expert review |
| **INVALID** | Claim is factually wrong | Blocked with explanation and corrected information |
| **OUTDATED** | Claim was once true but data has changed | Flagged with current data |

---

## Conflict Detection

When sources disagree, White Circle classifies the conflict:

### Type 1: ERROR

One source is factually wrong. A correct answer exists.

**Example**: Speaker says "EU AI Act passed in 2022" vs article says "passed March 2024"
- One is simply wrong
- Flag the error, teach the correct information
- The error itself becomes a learning moment

### Type 2: LEGITIMATE DEBATE

Multiple valid perspectives exist. No single "right answer."

**Example**: "Risk-based regulation is best" vs "Prescriptive regulation is more effective"
- Both have evidence and merit
- Understanding the tension IS the knowledge
- Creates a Debate Cluster with multiple Perspectives
- Becomes steelman challenge material at higher assessment tiers

---

## What the User Sees

```
+---------------------------------------------+
| AI Regulation Panel -- Claim Analysis        |
|                                              |
| 12 claims extracted                          |
| 9 verified | 2 under review | 1 flagged     |
|                                              |
| [checkmark] "EU AI Act uses a risk-based     |
|   framework"                                 |
|   Trust: 99% -- 4 sources confirm            |
|                                              |
| [checkmark] "Facial recognition is           |
|   classified high-risk"                      |
|   Trust: 97% -- Directly in Act text         |
|                                              |
| [warning] "90% of US startups will need      |
|   to comply by 2027"                         |
|   Trust: 34% -- No source found for "90%"    |
|   Status: Sent to expert reviewer            |
|   > YOU WILL NOT BE QUIZZED ON THIS          |
|     UNTIL IT'S VERIFIED                      |
|                                              |
| [x] "The EU AI Act was passed in 2022"       |
|   INCORRECT -- Passed March 2024,            |
|   effective August 2024                      |
|   > The speaker misstated this.              |
|     Correct date added to your               |
|     knowledge graph.                         |
+---------------------------------------------+
```

**Key principle**: "You will not be quizzed on this until it's verified." Nothing unverified enters the mastery pipeline.

---

## White Circle in Credentialing

Beyond content validation, White Circle also:

- **Validates quiz questions** are fair, unbiased, and test the claimed concept
- **Audits AI grading** to ensure responses are scored accurately
- **Ensures test-out assessments** match the difficulty of earning the level normally
- **Checks difficulty progression** is calibrated, not punitive
- **Certifies the credential pipeline** isn't compromised (no question leakage)
- **Monitors for gaming** -- detects patterns that suggest credential manipulation
