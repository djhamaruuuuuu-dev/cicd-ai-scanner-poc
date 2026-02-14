import express from 'express';
import { createServer } from 'http';
import axios from 'axios';

// Test scanner simulation
const findings = [
  {
    title: 'SQL Injection Vulnerability',
    severity: 'critical',
    description: 'SQL injection vulnerability detected in user login parameter.',
    location: 'src/controllers/authController.js',
    line_number: 45,
    confidence: 95,
    tool: 'semgrep'
  },
  {
    title: 'Weak Password Policy',
    severity: 'high',
    description: 'Password complexity requirements too weak.',
    location: 'src/middleware/auth.js',
    line_number: 78,
    confidence: 88,
    tool: 'sonarqube'
  },
  {
    title: 'Missing HTTPS Header',
    severity: 'medium',
    description: 'X-Content-Type-Options header not set.',
    location: 'src/app.js',
    line_number: 23,
    confidence: 92,
    tool: 'semgrep'
  },
  {
    title: 'Deprecated Package Used',
    severity: 'low',
    description: 'Package lodash is deprecated.',
    location: 'package.json',
    line_number: 15,
    confidence: 85,
    tool: 'trivy'
  },
  {
    title: 'Unused Variable',
    severity: 'info',
    description: 'Variable "temp" is defined but never used.',
    location: 'src/utils/helpers.js',
    line_number: 102,
    confidence: 78,
    tool: 'sonarqube'
  }
];

async function testScanner() {
  const app = express();
  const server = createServer(app);

  // Mock webhook endpoint
  app.use('/api/webhooks', express.json());

  app.post('/api/webhooks/:tool', (req, res) => {
    console.log(`\n📥 Received webhook from: ${req.params.tool}`);
    console.log('📋 Payload:', JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Webhook received' });
  });

  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`\n🧪 Test server running on http://localhost:${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhooks/:tool\n`);

    // Simulate scan and send webhook
    setTimeout(async () => {
      const scanData = {
        scan_id: `scan-${Date.now()}`,
        project_name: 'Test Project',
        github_repo: 'test-repo',
        findings: findings
      };

      console.log('📤 Sending test scan to webhook...');

      try {
        // Send to semgrep webhook
        await axios.post(`http://localhost:${PORT}/api/webhooks/semgrep`, scanData, {
          headers: { 'Content-Type': 'application/json' }
        });

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send to sonarqube webhook
        await axios.post(`http://localhost:${PORT}/api/webhooks/sonarqube`, {
          ...scanData,
          scan_id: `scan-${Date.now()}-sonarqube`,
          findings: findings.map(f => ({ ...f, tool: 'sonarqube' }))
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send to trivy webhook
        await axios.post(`http://localhost:${PORT}/api/webhooks/trivy`, {
          ...scanData,
          scan_id: `scan-${Date.now()}-trivy`,
          findings: findings.map(f => ({ ...f, tool: 'trivy' }))
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('\n✅ Test scan completed!');
        console.log('📊 Summary:');
        console.log(`   - Total findings: ${findings.length}`);
        console.log(`   - Tools notified: 3 (semgrep, sonarqube, trivy)`);
        console.log('\n💡 Tip: Run the main server to see AI analysis:\n');
        console.log('   cd /root/.openclaw/workspace/cicd-ai-scanner-poc');
        console.log('   npm install');
        console.log('   npm start');
        console.log('   # Then send another webhook request\n');

        server.close();
        process.exit(0);

      } catch (error) {
        console.error('❌ Error:', error.message);
        server.close();
        process.exit(1);
      }
    }, 1000);
  });
}

testScanner();
