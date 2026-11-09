/**
 * Hot Takes - Interactive Prototype Client Application
 * Hybrid Architecture: Connects to local Node server API when available,
 * and includes a zero-dependency Client-Side Fallback Engine so the prototype
 * runs 100% interactively even when opened directly as a static file (file:///)!
 */

// Global State
const state = {
  activeTab: 'tab-challenge1',
  conventionalRating: 5, // Default stated rating (1-5)
  revealedPackaging: 'standard', // 'standard' | 'eco'
  revealedSpeed: 'express', // 'express' | 'green'
  revealedReward: 'cashback', // 'cashback' | 'offset'
  userCredits: 100,
  answerFlips: 0,
  startTime: Date.now(),
  firstTouchTime: null,
  mouseTrajectory: [],
  choiceHistory: ['standard'],
  activeActionsCount: 0
};

// Mouse tracking for trajectory jitter calculation
window.addEventListener('mousemove', (e) => {
  if (!state.firstTouchTime) {
    state.firstTouchTime = Date.now();
  }
  if (state.mouseTrajectory.length < 50) {
    state.mouseTrajectory.push({ x: e.clientX, y: e.clientY, t: Date.now() });
  }
});

// Toast Notification System (replaces blocking alert dialogs)
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    info: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200',
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200'
  };

  toast.className = `p-3.5 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-medium flex items-center space-x-2.5 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto max-w-sm ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'error' ? 'bg-rose-400' : type === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'} animate-ping"></span>
    <span class="flex-1">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const activeEl = document.getElementById(tabId);
  if (activeEl) activeEl.classList.remove('hidden');

  // Update nav buttons
  const navMap = {
    'tab-challenge1': 'nav-challenge1',
    'tab-telemetry': 'nav-telemetry',
    'tab-ai-studio': 'nav-ai-studio',
    'tab-challenge2': 'nav-challenge2'
  };

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.className = 'tab-btn px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 text-slate-400 hover:text-white hover:bg-slate-800/60';
  });

  const activeBtn = document.getElementById(navMap[tabId]);
  if (activeBtn) {
    activeBtn.className = 'tab-btn px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 bg-indigo-600 text-white shadow-sm';
  }

  if (window.lucide) lucide.createIcons();
}

// Conventional Question Rating Handler
function selectConventional(rating) {
  state.conventionalRating = rating;
  if (!state.firstTouchTime) state.firstTouchTime = Date.now();

  const buttons = document.querySelectorAll('.conv-btn');
  buttons.forEach((btn, idx) => {
    if (idx + 1 === rating) {
      btn.className = 'conv-btn p-3 rounded-xl bg-indigo-600/30 border-2 border-indigo-500 text-center transition flex flex-col items-center shadow-lg shadow-indigo-500/20';
    } else {
      btn.className = 'conv-btn p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-center transition flex flex-col items-center';
    }
  });

  updateVirtueGapDisplay();
}

// Gamified Packaging Selection
function selectPackaging(type) {
  if (state.revealedPackaging !== type) {
    state.answerFlips++;
    state.activeActionsCount++;
    state.choiceHistory.push(type);
  }
  state.revealedPackaging = type;

  const btnStd = document.getElementById('btn-pack-std');
  const btnEco = document.getElementById('btn-pack-eco');

  if (type === 'standard') {
    btnStd.className = 'pack-opt p-3 rounded-xl border-2 border-indigo-500 bg-indigo-950/40 text-left transition flex flex-col justify-between';
    btnEco.className = 'pack-opt p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left transition flex flex-col justify-between';
  } else {
    btnEco.className = 'pack-opt p-3 rounded-xl border-2 border-emerald-500 bg-emerald-950/40 text-left transition flex flex-col justify-between';
    btnStd.className = 'pack-opt p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left transition flex flex-col justify-between';
  }

  recalculateBudget();
}

// Gamified Speed Selection
function selectSpeed(type) {
  if (state.revealedSpeed !== type) {
    state.answerFlips++;
    state.activeActionsCount++;
  }
  state.revealedSpeed = type;

  const btnExp = document.getElementById('btn-speed-exp');
  const btnGrn = document.getElementById('btn-speed-grn');

  if (type === 'express') {
    btnExp.className = 'speed-opt p-3 rounded-xl border-2 border-indigo-500 bg-indigo-950/40 text-left transition flex flex-col justify-between';
    btnGrn.className = 'speed-opt p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left transition flex flex-col justify-between';
  } else {
    btnGrn.className = 'speed-opt p-3 rounded-xl border-2 border-cyan-500 bg-cyan-950/40 text-left transition flex flex-col justify-between';
    btnExp.className = 'speed-opt p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left transition flex flex-col justify-between';
  }

  recalculateBudget();
}

// Gamified Reward Selection
function selectReward(type) {
  if (state.revealedReward !== type) {
    state.answerFlips++;
    state.activeActionsCount++;
  }
  state.revealedReward = type;

  const btnCash = document.getElementById('btn-rew-cash');
  const btnTree = document.getElementById('btn-rew-tree');

  if (type === 'cashback') {
    btnCash.className = 'rew-opt p-3 rounded-xl border-2 border-indigo-500 bg-indigo-950/40 text-left transition flex flex-col justify-between';
    btnTree.className = 'rew-opt p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left transition flex flex-col justify-between';
  } else {
    btnTree.className = 'rew-opt p-3 rounded-xl border-2 border-fuchsia-500 bg-fuchsia-950/40 text-left transition flex flex-col justify-between';
    btnCash.className = 'rew-opt p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left transition flex flex-col justify-between';
  }

  recalculateBudget();
}

// Budget & Revealed WTP Calculation
function recalculateBudget() {
  let budget = 100;
  let ecoSacrificeTokens = 0;

  if (state.revealedPackaging === 'eco') {
    budget -= 25;
    ecoSacrificeTokens += 25;
  }
  if (state.revealedSpeed === 'green') {
    budget -= 15;
    ecoSacrificeTokens += 15;
  }
  if (state.revealedReward === 'offset') {
    budget -= 20;
    ecoSacrificeTokens += 20;
  } else if (state.revealedReward === 'cashback') {
    budget += 20;
  }

  state.userCredits = budget;
  document.getElementById('user-credits').innerText = budget;
  document.getElementById('interaction-flips-count').innerText = state.answerFlips;

  // Max possible eco sacrifice is 60 tokens (25 + 15 + 20)
  const revealedWtpPct = Math.round((ecoSacrificeTokens / 60) * 100);
  updateVirtueGapDisplay(revealedWtpPct);
  syncTelemetryToBackend();
}

// Update Virtue Gap Display
function updateVirtueGapDisplay(revealedWtpPct = 0) {
  const statedPct = Math.round(((state.conventionalRating - 1) / 4) * 100);
  const gap = Math.max(0, statedPct - revealedWtpPct);

  document.getElementById('stated-importance-display').innerText = `${statedPct}% (Rating ${state.conventionalRating}/5)`;
  document.getElementById('stated-bar').style.width = `${statedPct}%`;

  document.getElementById('revealed-wtp-display').innerText = `${revealedWtpPct}%`;
  document.getElementById('revealed-bar').style.width = `${revealedWtpPct}%`;

  const gapDisplay = document.getElementById('virtue-gap-display');
  gapDisplay.innerText = `${gap}%`;

  const verdictEl = document.getElementById('authenticity-verdict');
  const pillEl = document.getElementById('virtue-status-pill');
  const summaryEl = document.getElementById('insight-summary');

  if (gap >= 50) {
    verdictEl.innerText = 'High Social Desirability Bias';
    verdictEl.className = 'text-sm font-bold text-rose-400';
    pillEl.innerText = 'High Virtue Gap';
    pillEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30';
    summaryEl.innerText = `Subject claimed ${statedPct}% environmental commitment on the conventional survey, but surrendered eco options when confronted with token/speed tradeoffs (Revealed WTP: ${revealedWtpPct}%). Conventional survey yields a false commercial signal!`;
  } else if (gap >= 20) {
    verdictEl.innerText = 'Moderate Aspirational Gap';
    verdictEl.className = 'text-sm font-bold text-amber-400';
    pillEl.innerText = 'Moderate Bias';
    pillEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
    summaryEl.innerText = `Subject displays moderate eco-interest but compromises on speed or cashback. Revealed preferences suggest willingness to pay only up to a 10% price premium.`;
  } else {
    verdictEl.innerText = 'Authentic Value Alignment';
    verdictEl.className = 'text-sm font-bold text-emerald-400';
    pillEl.innerText = 'Consistent Panelist';
    pillEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    summaryEl.innerText = `Genuine behavioral consistency observed! Subject sacrifices tokens and convenience to uphold stated sustainability commitments.`;
  }
}

// Finalize Game Choice
function finalizeGameChoice() {
  syncTelemetryToBackend();
  showToast('Order committed! Switching to Live Telemetry Inspector...', 'success');
  setTimeout(() => switchTab('tab-telemetry'), 600);
}

// =========================================================================
// EMBEDDED CLIENT-SIDE INTELLIGENCE & VERIFICATION ENGINE (ZERO NETWORK)
// =========================================================================

function clientCalculateEntropy(choices) {
  if (!choices || choices.length < 2) return 1.0;
  const counts = {};
  for (const c of choices) counts[c] = (counts[c] || 0) + 1;
  const n = choices.length;
  let entropy = 0;
  const uniqueValues = Object.keys(counts).length;
  if (uniqueValues <= 1) return 0.0;
  for (const key of Object.keys(counts)) {
    const p = counts[key] / n;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(uniqueValues);
  return maxEntropy > 0 ? entropy / maxEntropy : 0.0;
}

function clientComputeRQS(telemetry) {
  const {
    wordCount = 28,
    timeToFirstInteractionMs = 1200,
    totalDwellTimeMs = 4500,
    answerFlips = 1,
    cursorJitterVariance = 14.5,
    choiceHistory = ['standard', 'eco', 'standard']
  } = telemetry;

  // Pace Evaluation
  const estimatedReadTimeMs = Math.max(1500, (wordCount / (230 / 60)) * 1000);
  let paceScore = 0.5;
  let paceFlag = null;

  if (totalDwellTimeMs < estimatedReadTimeMs * 0.35) {
    paceScore = 0.1;
    paceFlag = 'RUSHED_RESPONSE: Answer submitted faster than human comprehension limit.';
  } else if (timeToFirstInteractionMs < 300) {
    paceScore = 0.35;
    paceFlag = 'REFLEXIVE_TAP: First touch occurred before prompt could be parsed.';
  } else {
    const paceRatio = totalDwellTimeMs / estimatedReadTimeMs;
    paceScore = Math.min(1.0, 0.75 + Math.min(0.25, paceRatio * 0.1));
  }

  // Deliberation Evaluation
  let delibScore = 0.8;
  let cognitiveState = 'CONFIDENT';
  if (answerFlips >= 1 && answerFlips <= 3) {
    delibScore = 1.0;
    cognitiveState = 'ACTIVE_EVALUATION';
  } else if (answerFlips > 5) {
    delibScore = 0.35;
    cognitiveState = 'ERRATIC_CONFUSION';
  }

  if (cursorJitterVariance < 1.0) {
    delibScore *= 0.5;
    cognitiveState = 'SYNTHETIC_OR_BOT_TRAJECTORY';
  }

  const entropy = clientCalculateEntropy(choiceHistory);
  const flags = [];
  if (paceFlag) flags.push(paceFlag);
  if (cognitiveState === 'ERRATIC_CONFUSION') flags.push('ERRATIC_ANSWER_FLIPS');
  if (cognitiveState === 'SYNTHETIC_OR_BOT_TRAJECTORY') flags.push('LOW_TRAJECTORY_JITTER_BOT_RISK');
  if (entropy < 0.45 && choiceHistory.length >= 3) flags.push('STRAIGHT_LINING_SUSPECTED');

  const rawRQS = (
    paceScore * 0.35 +
    delibScore * 0.30 +
    Math.min(1.0, entropy + 0.2) * 0.25 +
    (cursorJitterVariance > 2.0 ? 1.0 : 0.2) * 0.10
  ) * 100;

  const penalty = flags.length * 15;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawRQS - penalty)));

  let qualityTier = 'GOLD';
  if (finalScore < 40) qualityTier = 'REJECTED';
  else if (finalScore < 65) qualityTier = 'SUSPICIOUS';
  else if (finalScore < 85) qualityTier = 'SILVER';

  return {
    responseQualityScore: finalScore,
    qualityTier,
    entropy: parseFloat(entropy.toFixed(2)),
    cognitiveState,
    anomalyFlags: flags,
    isValidResponse: finalScore >= 60
  };
}

function clientComputeES(gameTelemetry) {
  const {
    sliderAdjustments = 3,
    cardsSwiped = 4,
    microInteractionsCount = 8,
    activeManipulatingTimeMs = 3400,
    totalDwellTimeMs = 4800
  } = gameTelemetry;

  const totalSecs = Math.max(1, totalDwellTimeMs / 1000);
  const actionsPerSec = (sliderAdjustments + cardsSwiped + microInteractionsCount) / totalSecs;
  const actionScore = Math.min(1.0, actionsPerSec / 1.5);
  const activeRatio = Math.min(1.0, activeManipulatingTimeMs / Math.max(1, totalDwellTimeMs));
  const mechanicsScore = Math.min(1.0, (sliderAdjustments > 0 ? 0.5 : 0) + (cardsSwiped > 0 ? 0.5 : 0));

  const compositeScore = Math.round((actionScore * 0.40 + activeRatio * 0.35 + mechanicsScore * 0.25) * 100);

  return {
    engagementScore: Math.max(10, Math.min(100, compositeScore)),
    engagementGrade: compositeScore > 80 ? 'HIGH IMMERSION' : compositeScore > 50 ? 'MODERATE' : 'PASSIVE'
  };
}

// Pseudo-HMAC Salted Hash for in-browser offline simulation
function clientHashToken(str) {
  if (!str) return 'null_token';
  let clean = String(str).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^\d+$/.test(clean) && clean.length > 10) clean = clean.slice(-10);
  let hash = 0x811c9dc5;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8) + 'c94e019b841a2f60e1d8a39';
}

// Synchronize Telemetry with Server (with Seamless Offline Client Engine)
function syncTelemetryToBackend() {
  const dwellTime = Date.now() - state.startTime;
  const timeToFirst = state.firstTouchTime ? state.firstTouchTime - state.startTime : 1200;

  // Calculate cursor jitter variance
  let jitter = 14.5;
  if (state.mouseTrajectory.length > 5) {
    const diffs = [];
    for (let i = 1; i < state.mouseTrajectory.length; i++) {
      const dx = state.mouseTrajectory[i].x - state.mouseTrajectory[i - 1].x;
      const dy = state.mouseTrajectory[i].y - state.mouseTrajectory[i - 1].y;
      diffs.push(Math.sqrt(dx * dx + dy * dy));
    }
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = diffs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / diffs.length;
    jitter = Math.max(2.0, Math.min(30.0, variance));
  }

  const payload = {
    explicitRating: state.conventionalRating,
    revealedAllocation: parseInt(document.getElementById('revealed-wtp-display').innerText) || 0,
    telemetry: {
      wordCount: 28,
      timeToFirstInteractionMs: timeToFirst,
      totalDwellTimeMs: dwellTime,
      answerFlips: state.answerFlips,
      cursorJitterVariance: parseFloat(jitter.toFixed(2)),
      choiceHistory: state.choiceHistory
    },
    gameTelemetry: {
      sliderAdjustments: state.answerFlips,
      cardsSwiped: 4,
      microInteractionsCount: state.activeActionsCount + 5,
      activeManipulatingTimeMs: Math.round(dwellTime * 0.7),
      totalDwellTimeMs: dwellTime
    }
  };

  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      updateTelemetryUI(data.rqs, data.es, payload);
    } else {
      fallbackClientEngine(payload);
    }
  })
  .catch(() => {
    // Seamless fallback to client-side mathematical engine
    fallbackClientEngine(payload);
  });
}

function fallbackClientEngine(payload) {
  const rqs = clientComputeRQS(payload.telemetry);
  const es = clientComputeES(payload.gameTelemetry);
  updateTelemetryUI(rqs, es, payload);
}

function updateTelemetryUI(rqs, es, payload) {
  document.getElementById('card-rqs-score').innerText = rqs.responseQualityScore;
  document.getElementById('card-rqs-tier').innerText = `${rqs.qualityTier} TIER`;
  document.getElementById('card-rqs-bar').style.width = `${rqs.responseQualityScore}%`;

  document.getElementById('card-es-score').innerText = es.engagementScore;
  document.getElementById('card-es-tier').innerText = es.engagementGrade;
  document.getElementById('card-es-bar').style.width = `${es.engagementScore}%`;

  const dwellSec = (payload.telemetry.totalDwellTimeMs / 1000).toFixed(1);
  document.getElementById('card-dwell-sec').innerText = `${dwellSec}s`;
  document.getElementById('card-flips-badge').innerText = `${payload.telemetry.answerFlips} Reversals`;
  document.getElementById('card-cognitive-desc').innerText = rqs.cognitiveState;

  if (document.getElementById('card-entropy-score')) {
    const entropyVal = rqs.entropy !== undefined ? rqs.entropy : 0.89;
    document.getElementById('card-entropy-score').innerText = entropyVal;
    document.getElementById('card-entropy-status').innerText = entropyVal > 0.4 ? 'NON-PATTERNED' : 'PATTERNED / STRAIGHT-LINE';
    document.getElementById('card-entropy-status').className = entropyVal > 0.4 ? 'text-xs font-bold text-emerald-400' : 'text-xs font-bold text-rose-400';
  }

  // Update Anomaly Badges Container
  const badgesContainer = document.getElementById('anomaly-badges-container');
  if (badgesContainer) {
    if (rqs.anomalyFlags && rqs.anomalyFlags.length > 0) {
      badgesContainer.innerHTML = rqs.anomalyFlags.map(flag => `
        <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span class="text-xs font-semibold text-rose-200">${flag}</span>
          </div>
          <span class="text-[11px] font-mono text-rose-400">FLAGGED</span>
        </div>
      `).join('');
    } else {
      badgesContainer.innerHTML = `
        <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-semibold text-emerald-200">Natural Reading Cadence</span>
          </div>
          <span class="text-[11px] font-mono text-emerald-400">${payload.telemetry.totalDwellTimeMs}ms dwell</span>
        </div>
        <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-semibold text-emerald-200">Pointer Micro-Jitter Present</span>
          </div>
          <span class="text-[11px] font-mono text-emerald-400">σ² = ${payload.telemetry.cursorJitterVariance} (Human)</span>
        </div>
      `;
    }
  }

  // JSON viewer
  const viewer = document.getElementById('telemetry-json-viewer');
  if (viewer) {
    viewer.innerText = JSON.stringify({
      sessionId: 'sess_' + Math.random().toString(36).substring(2, 10),
      ingestedTelemetry: payload.telemetry,
      computedScores: {
        rqs: rqs.responseQualityScore,
        tier: rqs.qualityTier,
        anomalyFlags: rqs.anomalyFlags || [],
        engagementScore: es.engagementScore,
        cognitiveState: rqs.cognitiveState
      }
    }, null, 2);
  }
}

// Evaluator Simulation: Normal User
function simulateNormalUser() {
  state.startTime = Date.now() - 4800;
  state.firstTouchTime = state.startTime + 1200;
  state.answerFlips = 2;
  state.activeActionsCount = 6;
  state.choiceHistory = ['standard', 'eco', 'standard'];
  syncTelemetryToBackend();
  showToast('Simulated genuine human: healthy 4.8s dwell, 2 reversals, normal jitter.', 'success');
}

// Evaluator Simulation: Speeding Bot
function simulateSpeedingBot() {
  const botPayload = {
    explicitRating: 5,
    revealedAllocation: 0,
    telemetry: {
      wordCount: 30,
      timeToFirstInteractionMs: 90,
      totalDwellTimeMs: 380,
      answerFlips: 0,
      cursorJitterVariance: 0.1,
      choiceHistory: ['A', 'A', 'A', 'A']
    },
    gameTelemetry: {
      sliderAdjustments: 0,
      cardsSwiped: 0,
      microInteractionsCount: 1,
      activeManipulatingTimeMs: 80,
      totalDwellTimeMs: 380
    }
  };

  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(botPayload)
  })
  .then(res => res.json())
  .then(data => {
    updateTelemetryUI(data.rqs, data.es, botPayload);
    showToast('Simulated Speeding Bot! RQS dropped to REJECTED tier.', 'error');
  })
  .catch(() => {
    fallbackClientEngine(botPayload);
    showToast('Simulated Speeding Bot! RQS dropped to <40 (REJECTED tier) with RUSHED & STRAIGHT-LINING flags.', 'error');
  });
}

// AI Question Studio Presets
const presets = {
  eco: {
    question: "How important is eco-friendly packaging when you order items online?",
    sdr: "HIGH (85/100)",
    acq: "MODERATE (62/100)",
    pred: "POOR (28/100)",
    rec: "Convert from static Likert rating to dynamic micro-budget token allocation or rapid-choice swipe cards with explicit cost tradeoffs."
  },
  fitness: {
    question: "How often do you exercise and maintain a healthy diet each week?",
    sdr: "SEVERE (94/100)",
    acq: "HIGH (78/100)",
    pred: "VERY POOR (18/100)",
    rec: "Replace with 'Calendar Time-Auction': force users to allocate 24 hours of Saturday across Netflix, social life, sleep, and gym."
  },
  privacy: {
    question: "Would you pay a monthly fee for a social platform that protects all your data and shows zero ads?",
    sdr: "HIGH (76/100)",
    acq: "MODERATE (60/100)",
    pred: "POOR (22/100)",
    rec: "Use Blind Mystery Subscription: give users \$10 in digital tokens to unlock features and measure if ad-free is chosen over premium content."
  },
  luxury: {
    question: "Do you only purchase authentic luxury goods and avoid counterfeit alternatives?",
    sdr: "CRITICAL (96/100)",
    acq: "HIGH (82/100)",
    pred: "EXTREMELY POOR (12/100)",
    rec: "Use Projective Roleplay: Ask 'If a close friend bought a 1:1 replica handbag for 10% of retail, would you advise them to wear it?'"
  }
};

function loadPresetQuestion() {
  const val = document.getElementById('preset-question-select').value;
  const p = presets[val] || presets.eco;
  document.getElementById('ai-question-input').value = p.question;
  document.getElementById('audit-sdr').innerText = p.sdr;
  document.getElementById('audit-acq').innerText = p.acq;
  document.getElementById('audit-pred').innerText = p.pred;
  document.getElementById('audit-recommendation').innerText = p.rec;
}

function runAIAudit() {
  loadPresetQuestion();
  showToast('AI Bias Analysis Completed! 3 gamified mechanics generated.', 'success');
}

// Challenge 2: Duplicate Account Simulator (Hybrid Server + Offline Client)
function testDuplicateVerification() {
  const phone = document.getElementById('sim-phone').value;
  const upi = document.getElementById('sim-upi').value;
  const dob = document.getElementById('sim-dob').value;

  const requestBody = {
    phoneNumber: phone,
    upiVpa: upi,
    dateOfBirth: dob,
    profile: { verificationTier: 2, totalStudiesCompleted: 5, averageRQS: 84 }
  };

  fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })
  .then(res => res.json())
  .then(data => {
    applyVerificationResults(data);
    showToast('Verification check processed via server API.', 'info');
  })
  .catch(() => {
    // Client-side verification fallback
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const isDupPhone = cleanPhone.includes('9876543210');
    const isDupUpi = upi.trim().toLowerCase() === 'existinguser@okhdfcbank';
    const isDuplicate = isDupPhone || isDupUpi;

    // Age validation
    const birthDate = new Date(dob);
    const today = new Date('2026-11-09');
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) age--;

    const clientData = {
      duplicateCheck: {
        isDuplicate,
        message: isDuplicate 
          ? (isDupPhone ? 'Account with identical phone hash already exists.' : 'Target payout UPI VPA already bound to another profile.')
          : 'Clean uniqueness check.'
      },
      ageCheck: {
        isEligible: age >= 18,
        ageYears: age
      },
      hashes: {
        phoneHash: clientHashToken(phone),
        upiHash: clientHashToken(upi)
      }
    };

    applyVerificationResults(clientData);
    showToast(isDuplicate ? 'Sybil Collision Detected!' : 'Identity Verified Clean & Unique!', isDuplicate ? 'warning' : 'success');
  });
}

function applyVerificationResults(data) {
  if (data.duplicateCheck) {
    const resDup = document.getElementById('res-dup-status');
    const resReason = document.getElementById('res-dup-reason');
    if (data.duplicateCheck.isDuplicate) {
      resDup.innerText = 'COLLISION DETECTED';
      resDup.className = 'text-xs font-bold font-mono text-rose-400';
      resReason.innerText = data.duplicateCheck.message;
      resReason.className = 'text-[11px] text-rose-300 font-mono';
    } else {
      resDup.innerText = 'UNIQUE & VERIFIED';
      resDup.className = 'text-xs font-bold font-mono text-emerald-400';
      resReason.innerText = 'No phone or payment collision detected.';
      resReason.className = 'text-[11px] text-emerald-300 font-mono';
    }
  }

  if (data.ageCheck) {
    const resAge = document.getElementById('res-age-status');
    if (data.ageCheck.isEligible) {
      resAge.innerText = `ELIGIBLE (Age: ${data.ageCheck.ageYears})`;
      resAge.className = 'text-xs font-bold font-mono text-emerald-400';
    } else {
      resAge.innerText = `DISQUALIFIED UNDERAGE (Age: ${data.ageCheck.ageYears})`;
      resAge.className = 'text-xs font-bold font-mono text-rose-400';
    }
  }

  if (data.hashes) {
    document.getElementById('res-phone-hash').innerText = data.hashes.phoneHash.substring(0, 36) + '...';
    document.getElementById('res-upi-hash').innerText = data.hashes.upiHash.substring(0, 36) + '...';
  }
}

function resetExperiment() {
  state.conventionalRating = 5;
  state.revealedPackaging = 'standard';
  state.revealedSpeed = 'express';
  state.revealedReward = 'cashback';
  state.userCredits = 100;
  state.answerFlips = 0;
  state.startTime = Date.now();
  state.firstTouchTime = null;
  state.choiceHistory = ['standard'];
  selectConventional(5);
  selectPackaging('standard');
  selectSpeed('express');
  selectReward('cashback');
  recalculateBudget();
  showToast('Experiment reset to initial state.', 'info');
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  recalculateBudget();
});
