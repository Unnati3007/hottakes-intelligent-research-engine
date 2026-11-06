const test = require('node:test');
const assert = require('node:assert');
const { IntelligenceEngine } = require('../src/intelligence_engine');
const { VerificationEngine } = require('../src/verification_engine');

test('IntelligenceEngine - Entropy & Straight-Lining Detection', async (t) => {
  const engine = new IntelligenceEngine();

  // Test 1: Complete straight-lining (all choices identical)
  const straightLine = ['A', 'A', 'A', 'A', 'A'];
  const entropyZero = engine.calculateEntropy(straightLine);
  assert.strictEqual(entropyZero, 0.0, 'Straight-line responses must yield 0 entropy');

  // Test 2: Balanced diversified choices
  const balanced = ['A', 'B', 'C', 'A', 'B', 'C'];
  const entropyHigh = engine.calculateEntropy(balanced);
  assert.ok(entropyHigh > 0.8, 'Balanced choices must yield high normalized entropy');
});

test('IntelligenceEngine - Reading Pace & Speeding Penalties', async (t) => {
  const engine = new IntelligenceEngine();

  // Test 1: Rushed response (30 words submitted in 400ms)
  const rushed = engine.evaluateReadingPace(30, 150, 400);
  assert.strictEqual(rushed.flagged, true);
  assert.ok(rushed.reason.includes('RUSHED_RESPONSE'));
  assert.ok(rushed.score <= 0.2);

  // Test 2: Reflexive tap (first touch under 300ms, even if user lingered afterwards)
  const reflexive = engine.evaluateReadingPace(30, 180, 5000);
  assert.strictEqual(reflexive.flagged, true);
  assert.ok(reflexive.reason.includes('REFLEXIVE_TAP'));

  // Test 3: Normal human deliberation pace (30 words read in 4500ms)
  const normal = engine.evaluateReadingPace(30, 1400, 4500);
  assert.strictEqual(normal.flagged, false);
  assert.ok(normal.score >= 0.7);
});

test('IntelligenceEngine - Virtue Gap & Social Desirability Index', async (t) => {
  const engine = new IntelligenceEngine();

  // Scenario 1: User claims 5/5 ("Eco-friendly packaging is vital!"), but allocates 0% of budget to it
  const highHypocrisy = engine.calculateVirtueGap(5, 0);
  assert.strictEqual(highHypocrisy.claimedImportancePct, 100);
  assert.strictEqual(highHypocrisy.revealedWillingnessToPayPct, 0);
  assert.strictEqual(highHypocrisy.virtueGap, 100);
  assert.strictEqual(highHypocrisy.category, 'HIGH_SOCIAL_DESIRABILITY_BIAS');

  // Scenario 2: User claims 4/5 and actually allocates 70% of budget to green options
  const genuineUser = engine.calculateVirtueGap(4, 70);
  assert.strictEqual(genuineUser.claimedImportancePct, 75);
  assert.strictEqual(genuineUser.revealedWillingnessToPayPct, 70);
  assert.strictEqual(genuineUser.virtueGap, 5);
  assert.strictEqual(genuineUser.category, 'GENUINE_BEHAVIORAL_ALIGNMENT');
});

test('IntelligenceEngine - Composite Response Quality Score (RQS)', async (t) => {
  const engine = new IntelligenceEngine();

  // Gold standard response
  const goldPayload = {
    wordCount: 28,
    timeToFirstInteractionMs: 1400,
    totalDwellTimeMs: 4800,
    answerFlips: 2,
    cursorJitterVariance: 16.2,
    choiceHistory: ['A', 'C', 'B', 'A']
  };
  const goldResult = engine.computeResponseQualityScore(goldPayload);
  assert.ok(goldResult.responseQualityScore >= 80, `Expected high RQS, got ${goldResult.responseQualityScore}`);
  assert.strictEqual(goldResult.qualityTier, 'GOLD');
  assert.strictEqual(goldResult.isValidResponse, true);

  // Bot-like straight line speeding response
  const botPayload = {
    wordCount: 28,
    timeToFirstInteractionMs: 120,
    totalDwellTimeMs: 450,
    answerFlips: 0,
    cursorJitterVariance: 0.1, // Zero trajectory jitter (synthetic)
    choiceHistory: ['A', 'A', 'A', 'A']
  };
  const botResult = engine.computeResponseQualityScore(botPayload);
  assert.ok(botResult.responseQualityScore < 40, `Expected failed RQS for bot, got ${botResult.responseQualityScore}`);
  assert.strictEqual(botResult.qualityTier, 'REJECTED');
  assert.strictEqual(botResult.isValidResponse, false);
  assert.ok(botResult.anomalyFlags.length >= 2);
});

test('VerificationEngine - Age & Identity Uniqueness', async (t) => {
  const vEngine = new VerificationEngine();

  // Age validation
  const adult = vEngine.validateAgeEligibility('2000-05-15');
  assert.strictEqual(adult.isEligible, true);
  assert.ok(adult.ageYears >= 24);

  const minor = vEngine.validateAgeEligibility('2014-08-20');
  assert.strictEqual(minor.isEligible, false);
  assert.strictEqual(minor.reason, 'UNDERAGE_DISQUALIFIED');

  // Privacy Hashing
  const hash1 = vEngine.hashIdentityToken('+91 98765 43210');
  const hash2 = vEngine.hashIdentityToken('9876543210');
  assert.strictEqual(hash1, hash2, 'Sanitized phone numbers must map to identical hash');

  // Sybil Duplicate Detection
  const existingUsers = [
    {
      phoneHash: hash1,
      upiHash: vEngine.hashIdentityToken('user1@okhdfcbank'),
      deviceHash: 'device_fingerprint_xyz_123'
    }
  ];

  const duplicatePhone = vEngine.detectDuplicateAccount({ phoneNumber: '9876543210' }, existingUsers);
  assert.strictEqual(duplicatePhone.isDuplicate, true);
  assert.strictEqual(duplicatePhone.collisionVector, 'PRIMARY_PHONE_COLLISION');

  const duplicateUpi = vEngine.detectDuplicateAccount({ upiVpa: 'user1@okhdfcbank' }, existingUsers);
  assert.strictEqual(duplicateUpi.isDuplicate, true);
  assert.strictEqual(duplicateUpi.collisionVector, 'PAYMENT_RAIL_UPI_COLLISION');

  const uniqueUser = vEngine.detectDuplicateAccount({ phoneNumber: '9999988888', upiVpa: 'newuser@icici' }, existingUsers);
  assert.strictEqual(uniqueUser.isDuplicate, false);
});

test('VerificationEngine - Longitudinal Progressive Trust Score', async (t) => {
  const vEngine = new VerificationEngine();

  // Unverified new user
  const newUser = vEngine.calculateLongitudinalTrustScore({
    verificationTier: 1, // Phone only
    totalStudiesCompleted: 1,
    averageRQS: 70
  });
  assert.strictEqual(newUser.payoutEligible, false);
  assert.ok(newUser.trustScore < 60);

  // Fully verified high-reputation panelist
  const matureUser = vEngine.calculateLongitudinalTrustScore({
    verificationTier: 3, // DigiLocker
    totalStudiesCompleted: 12,
    averageRQS: 92,
    accountAgeDays: 45
  });
  assert.strictEqual(matureUser.payoutEligible, true);
  assert.ok(matureUser.trustScore >= 80);
  assert.strictEqual(matureUser.trustStatus, 'TRUSTED_PANELIST_TIER_1');
});
