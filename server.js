const http = require('http');
const fs = require('fs');
const path = require('path');
const { IntelligenceEngine } = require('./src/intelligence_engine');
const { VerificationEngine } = require('./src/verification_engine');

const PORT = process.env.PORT || 3000;
const intelligenceEngine = new IntelligenceEngine();
const verificationEngine = new VerificationEngine();

// In-memory directory for simulated duplicate account detection
const mockExistingDirectory = [
  {
    phoneHash: verificationEngine.hashIdentityToken('9876543210'),
    upiHash: verificationEngine.hashIdentityToken('existinguser@okhdfcbank'),
    deviceHash: 'device_fingerprint_sample_99'
  }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (req.url === '/api/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rqs = intelligenceEngine.computeResponseQualityScore(payload.telemetry || {});
        const es = intelligenceEngine.computeEngagementScore(payload.gameTelemetry || {});
        const virtueGap = intelligenceEngine.calculateVirtueGap(
          payload.explicitRating || 5,
          payload.revealedAllocation || 0
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, rqs, es, virtueGap, timestamp: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/verify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const duplicateCheck = verificationEngine.detectDuplicateAccount(payload, mockExistingDirectory);
        const ageCheck = payload.dateOfBirth ? verificationEngine.validateAgeEligibility(payload.dateOfBirth) : null;
        const phoneHash = verificationEngine.hashIdentityToken(payload.phoneNumber);
        const upiHash = verificationEngine.hashIdentityToken(payload.upiVpa);
        const trustEval = verificationEngine.calculateLongitudinalTrustScore(payload.profile || {});

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          duplicateCheck,
          ageCheck,
          hashes: { phoneHash, upiHash },
          trustEval
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, 'public', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n===============================================================`);
    console.log(`  HOT TAKES - Research & Intelligence Prototype Running!`);
    console.log(`  Local Server: http://localhost:${PORT}`);
    console.log(`===============================================================\n`);
  });
}

module.exports = server;

