# Hot Takes: 3–5 Minute Screen Recording Walkthrough Script
**Role:** Product & AI Engineering Intern / Engineer  
**Duration:** 3 to 5 minutes  
**Format:** Screen Recording (Browser with Prototype Open + Codebase / VS Code)

---

## Recording Checklist Before You Hit Record
1. **Open Prototype in Browser:** Open `hottakes-assignment/public/index.html` in your browser (or run `npm start` and open `http://localhost:3000`).
2. **Open VS Code:** Have the `hottakes-assignment` folder visible in VS Code so you can show the clean codebase, `intelligence_engine.js`, and test runner.
3. **Tone:** Energetic, clear, product-minded, and technically grounded. Speak as an engineer who cares deeply about real consumer behavior.

---

## Minute-by-Minute Script

### [0:00 – 0:45] Intro & Problem Statement
*(Screen: On Prototype Tab 1 - "Challenge 1 Prototype")*

> *"Hi Hot Takes team! Today I'm excited to walk you through my solution for both Challenge 1 and Challenge 2.*  
> *When approaching Hot Takes' core mission, I identified the fundamental problem in market research:*  
> *Traditional surveys don't capture what consumers actually do—they capture what consumers think sounds socially desirable.*  
> *For example, on the left here, we have a conventional survey question: 'How important is eco-friendly packaging to you on a 1 to 5 scale?'*  
> *If I click 5, like 84% of respondents do, it costs me nothing. There's zero friction, no economic sacrifice, and it creates a false commercial signal for brands.*  
> *Let's see how our redesigned Hot Takes engine solves this."*

---

### [0:45 – 1:45] Challenge 1 Part A: The Gamified Experience & The Virtue Gap
*(Action: Click through the trade-offs on the right: Packaging, Delivery Speed, Reward)*

> *"On the right is our redesigned experience: 'The Cart Dilemma.'*  
> *Instead of asking a hypothetical question, we give the user a finite wallet of 100 credits and make them build their actual delivery order.*  
> *Watch what happens when I toggle between Standard Packaging and 100% Bamboo Compostable packaging:*  
> *The bamboo packaging debits 25 credits. If I want Green Electric Delivery, that costs another 15 credits and adds 30 minutes of wait time.*  
> *And if I choose direct cashback instead of planting a tree, I get 20 credits back.*  
> *As soon as I commit this order, our engine reveals what we call the **'Virtue Gap'**:*  
> *I stated 100% importance on the survey, but my revealed willingness-to-pay was only 20%. Our system calculates an 80% Social Desirability Gap!*  
> *This gives brands the real truth: consumers want green packaging, but only if the price premium is under 10%."*

---

### [1:45 – 2:45] Challenge 1 Part B: Behavioural Telemetry & Response Quality Score (RQS)
*(Action: Switch to Tab 2: "Live Telemetry & RQS Inspector")*

> *"Now let's move to Part B: what happens behind the scenes.*  
> *Hot Takes isn't just about fun games; it's about response intelligence.*  
> *In Tab 2, you can see our live telemetry pipeline. In the background, we capture:*  
> *1. **Reading Pace:** We calculate the prompt's word count and compare it to adult reading speeds. If a user answers in 400 milliseconds, they couldn't have parsed the question—so we flag them for Speeding.*  
> *2. **Cognitive Deliberation:** We track answer flips. Switching between choices 1 to 3 times indicates healthy, active trade-off evaluation.*  
> *3. **Choice Shannon Entropy:** We calculate the mathematical entropy of choices across questions. If someone is straight-lining or clicking pattern 'A-A-A-A', entropy drops to near zero and triggers an anomaly flag.*  
> *4. **Micro-Trajectory Jitter:** We track cursor micro-movements. Human hands have natural jitter (variance > 4); automated Puppeteer bots move in perfectly straight vectors.*  
> *All of this feeds into our composite **Response Quality Score (RQS)** and **Engagement Score (ES)**. If I click 'Simulate Speeding Bot', you'll see RQS instantly plummet to the REJECTED tier with active anomaly flags."*

---

### [2:45 – 3:45] Challenge 2: Trustworthy Onboarding & Progressive Verification
*(Action: Switch to Tab 4: "Challenge 2 Verification")*

> *"Now let's discuss Challenge 2: Onboarding and Consumer Verification.*  
> *The biggest mistake an emerging consumer platform can make is demanding an Aadhaar card or government ID upon first download. It causes a 50% drop-off.*  
> *Instead, I designed a **'Earn First, Verify Upon Cashout'** progressive model:*  
> *Step 1: Download & 10-second Phone OTP. Zero KYC friction. Silent device fingerprinting.*  
> *Step 2: The user immediately plays 3 games and earns ₹150 in rewards. They experience delight and value first.*  
> *Step 3: Verification happens **only when they tap 'Withdraw ₹150 to UPI'**.*  
> *Why? Because money is waiting! The user *wants* to provide their UPI ID to receive cash.*  
> *By using a ₹1 UPI Penny-Drop verification via Cashfree or Razorpay, we validate their real legal bank account name and achieve 100% uniqueness at just ₹1.20 cost—with near-zero user drop-off.*  
> *For compliance with India's DPDP Act 2023, we never store raw government IDs. Notice in our simulator here: phone numbers and payment VPAs are immediately converted into salted HMAC-SHA256 tokens stored in an isolated PII Vault.*  
> *If a user tries to create a duplicate account with the same phone or UPI ID, our Sybil detector catches it instantly."*

---

### [3:45 – 4:30] Codebase & Test Suite Wrap-Up
*(Action: Switch to VS Code / Terminal, run `npm test`)*

> *"Finally, looking at the engineering implementation:*  
> *In our repository, we have modular, clean code:*  
> *`intelligence_engine.js` contains the mathematical formulations for Shannon Entropy, reading pace evaluation, virtue gap modeling, and composite RQS.*  
> *`verification_engine.js` handles the progressive trust state machine, age validation, and privacy-preserving token hashing.*  
> *And if I run `npm test` in the terminal, you'll see our automated test suite passes with 100% assertions covering straight-lining, bot speeding, virtue gaps, duplicate account collisions, and age checks.*  
> *Thank you so much for your time. I'm really excited about the future of consumer intelligence at Hot Takes and would love to bring these ideas into production with your team!"*

---
*(End of Recording — Stop screen capture)*

