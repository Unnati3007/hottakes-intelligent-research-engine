/**
 * Hot Takes - Intelligence Engine
 * Challenge 1 (Part A & Part B): Question Intelligence, Behavioural Telemetry,
 * Response Quality Scoring (RQS), Engagement Scoring (ES), and Anomaly Detection.
 */

class IntelligenceEngine {
  constructor(config = {}) {
    this.config = {
      minReadingSpeedWpm: 180, // Adult lower bound reading comprehension speed
      idealReadingSpeedWpm: 230,
      minComprehensionFloorMs: 1500, // Absolute minimum milliseconds before response can be genuine
      entropyThreshold: 0.45, // Minimum Shannon entropy for multi-item batteries
      maxNaturalFlips: 5, // More than 5 answer toggles suggests erratic guessing
      ...config
    };
  }

  /**
   * Calculates Shannon Entropy of choice distribution to detect straight-lining / robotic patterns
   * @param {Array<string|number>} choices - sequence of user choices across questions
   * @returns {number} Normalized entropy between 0.0 (totally patterned) and 1.0 (uniform random)
   */
  calculateEntropy(choices) {
    if (!choices || choices.length < 2) return 1.0;
    
    const counts = {};
    for (const c of choices) {
      counts[c] = (counts[c] || 0) + 1;
    }
    
    const n = choices.length;
    let entropy = 0;
    const uniqueValues = Object.keys(counts).length;
    if (uniqueValues <= 1) return 0.0; // Complete straight-line
    
    for (const key of Object.keys(counts)) {
      const p = counts[key] / n;
      entropy -= p * Math.log2(p);
    }
    
    const maxEntropy = Math.log2(uniqueValues);
    return maxEntropy > 0 ? entropy / maxEntropy : 0.0;
  }

  /**
   * Evaluates cognitive reading pace based on word count of prompt + options
   * @param {number} wordCount - Total words in question and options
   * @param {number} timeToFirstInteractionMs - Milliseconds before first touch
   * @param {number} totalDwellTimeMs - Milliseconds spent before submission
   * @returns {{ score: number, flagged: boolean, reason: string|null }}
   */
  evaluateReadingPace(wordCount, timeToFirstInteractionMs, totalDwellTimeMs) {
    // Human reading speed is approx 200-250 wpm => ~250-300ms per word.
    // Minimum comprehension time allows skimming at 2x speed
    const estimatedReadTimeMs = Math.max(
      this.config.minComprehensionFloorMs,
      (wordCount / (this.config.idealReadingSpeedWpm / 60)) * 1000
    );

    if (totalDwellTimeMs < estimatedReadTimeMs * 0.35) {
      return {
        score: 0.1,
        flagged: true,
        reason: 'RUSHED_RESPONSE: Answer submitted significantly faster than human comprehension limit.'
      };
    }

    if (timeToFirstInteractionMs < 300) {
      return {
        score: 0.35,
        flagged: true,
        reason: 'REFLEXIVE_TAP: First interaction occurred before question could be parsed.'
      };
    }

    // Healthy deliberation range
    const paceRatio = totalDwellTimeMs / estimatedReadTimeMs;
    // Score peaks when user takes between 0.6x and 2.0x of expected reading time
    let paceScore = 0.5;
    if (paceRatio >= 0.5 && paceRatio <= 3.0) {
      paceScore = 0.75 + Math.min(0.25, paceRatio * 0.1);
    } else if (paceRatio > 3.0) {
      paceScore = 0.70; // Idle/slow reading is still valid
    } else {
      paceScore = 0.40;
    }

    return { score: Math.min(1.0, paceScore), flagged: false, reason: null };
  }

  /**
   * Evaluates cognitive deliberation via answer flips and trajectory hesitation
   * @param {number} answerFlips - How many times user switched choices before finalizing
   * @param {number} cursorJitterVariance - Micro-movement variance indicating mouse/touch presence
   * @returns {{ score: number, cognitiveState: string }}
   */
  evaluateDeliberation(answerFlips, cursorJitterVariance = 12.0) {
    let score = 0.8;
    let cognitiveState = 'CONFIDENT';

    if (answerFlips === 0) {
      // Direct choice - fine if pace was healthy, but lacks observable trade-off friction
      score = 0.85;
      cognitiveState = 'DECISIVE_OR_INTUITIVE';
    } else if (answerFlips >= 1 && answerFlips <= 3) {
      // 1-3 flips is the gold standard for active cognitive evaluation in trade-off games
      score = 1.0;
      cognitiveState = 'ACTIVE_EVALUATION';
    } else if (answerFlips > this.config.maxNaturalFlips) {
      score = 0.35;
      cognitiveState = 'ERRATIC_CONFUSION';
    }

    // Check for bot-like linear trajectory (0 jitter variance)
    if (cursorJitterVariance < 1.0) {
      score *= 0.5;
      cognitiveState = 'SYNTHETIC_OR_BOT_TRAJECTORY';
    }

    return { score, cognitiveState };
  }

  /**
   * Calculates the Virtue Gap (Social Desirability Index)
   * Quantifies divergence between self-reported ethics vs actual economic trade-off sacrifice
   * @param {number} explicitRating - Conventional 1 to 5 scale (e.g. 5 = "I care deeply")
   * @param {number} revealedAllocation - % of budget allocated to ethical feature (0 to 100)
   * @returns {{ virtueGap: number, socialDesirabilityScore: number, category: string }}
   */
  calculateVirtueGap(explicitRating, revealedAllocation) {
    const normalizedClaim = ((explicitRating - 1) / 4) * 100; // 0 to 100%
    const gap = Math.max(0, normalizedClaim - revealedAllocation);
    
    let category = 'CONSISTENT';
    if (gap > 50) {
      category = 'HIGH_SOCIAL_DESIRABILITY_BIAS';
    } else if (gap > 25) {
      category = 'MODERATE_ASPIRATIONAL_GAP';
    } else {
      category = 'GENUINE_BEHAVIORAL_ALIGNMENT';
    }

    return {
      claimedImportancePct: normalizedClaim,
      revealedWillingnessToPayPct: revealedAllocation,
      virtueGap: Math.round(gap),
      socialDesirabilityScore: Math.round(Math.min(100, gap * 1.5)),
      category
    };
  }

  /**
   * Generates composite Response Quality Score (RQS: 0-100)
   * @param {Object} telemetry - Raw behavioural telemetry event data
   * @returns {Object} Scored payload with breakdowns and anomaly flags
   */
  computeResponseQualityScore(telemetry) {
    const {
      wordCount = 30,
      timeToFirstInteractionMs = 1200,
      totalDwellTimeMs = 4500,
      answerFlips = 1,
      cursorJitterVariance = 14.5,
      choiceHistory = ['A', 'B', 'A']
    } = telemetry;

    const paceEval = this.evaluateReadingPace(wordCount, timeToFirstInteractionMs, totalDwellTimeMs);
    const deliberationEval = this.evaluateDeliberation(answerFlips, cursorJitterVariance);
    const entropy = this.calculateEntropy(choiceHistory);

    const flags = [];
    if (paceEval.flagged) flags.push(paceEval.reason);
    if (deliberationEval.cognitiveState === 'ERRATIC_CONFUSION') flags.push('ERRATIC_ANSWER_FLIPS');
    if (deliberationEval.cognitiveState === 'SYNTHETIC_OR_BOT_TRAJECTORY') flags.push('LOW_TRAJECTORY_JITTER_BOT_RISK');
    if (entropy < this.config.entropyThreshold && choiceHistory.length >= 3) flags.push('STRAIGHT_LINING_SUSPECTED');

    // Weights: Pace (35%), Deliberation (30%), Entropy/Diversity (25%), Jitter (10%)
    const rawRQS = (
      paceEval.score * 0.35 +
      deliberationEval.score * 0.30 +
      Math.min(1.0, entropy + 0.2) * 0.25 +
      (cursorJitterVariance > 2.0 ? 1.0 : 0.2) * 0.10
    ) * 100;

    const penalty = flags.length * 15;
    const finalScore = Math.max(0, Math.min(100, Math.round(rawRQS - penalty)));

    let qualityTier = 'GOLD';
    if (finalScore < 40) qualityTier = 'REJECTED';
    else if (finalScore < 65) qualityTier = 'SUSPICIOUS_NEEDS_REVIEW';
    else if (finalScore < 85) qualityTier = 'SILVER';

    return {
      responseQualityScore: finalScore,
      qualityTier,
      subScores: {
        paceScore: Math.round(paceEval.score * 100),
        deliberationScore: Math.round(deliberationEval.score * 100),
        entropyScore: Math.round(entropy * 100)
      },
      cognitiveState: deliberationEval.cognitiveState,
      anomalyFlags: flags,
      isValidResponse: finalScore >= 60
    };
  }

  /**
   * Generates composite Engagement Score (ES: 0-100)
   * Measures active gamification interaction depth
   * @param {Object} gameTelemetry
   * @returns {Object}
   */
  computeEngagementScore(gameTelemetry) {
    const {
      sliderAdjustments = 3,
      cardsSwiped = 4,
      microInteractionsCount = 8,
      activeManipulatingTimeMs = 3800,
      totalDwellTimeMs = 5200
    } = gameTelemetry;

    // Interaction density: micro-actions per second
    const totalSecs = Math.max(1, totalDwellTimeMs / 1000);
    const actionsPerSec = (sliderAdjustments + cardsSwiped + microInteractionsCount) / totalSecs;
    const actionScore = Math.min(1.0, actionsPerSec / 1.5);

    // Active ratio: how much time spent dragging/toggling vs idling
    const activeRatio = Math.min(1.0, activeManipulatingTimeMs / Math.max(1, totalDwellTimeMs));

    // Mechanics depth: exploring multiple interactive elements
    const mechanicsScore = Math.min(1.0, (sliderAdjustments > 0 ? 0.5 : 0) + (cardsSwiped > 0 ? 0.5 : 0));

    const compositeScore = Math.round((actionScore * 0.40 + activeRatio * 0.35 + mechanicsScore * 0.25) * 100);

    return {
      engagementScore: Math.max(10, Math.min(100, compositeScore)),
      actionsPerSecond: parseFloat(actionsPerSec.toFixed(2)),
      activeTimePercentage: Math.round(activeRatio * 100),
      engagementGrade: compositeScore > 80 ? 'HIGH_IMMERSION' : compositeScore > 50 ? 'MODERATE' : 'PASSIVE'
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IntelligenceEngine };
}
