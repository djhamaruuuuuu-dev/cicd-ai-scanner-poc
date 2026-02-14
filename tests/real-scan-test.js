import axios from 'axios';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cicd_scanner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Realistic security findings for a Node.js project
const realisticFindings = [
  {
    title: 'SQL Injection Vulnerability',
    severity: 'critical',
    description: 'SQL injection vulnerability detected in user authentication query. Input from "user_input" parameter is directly concatenated with SQL query.',
    location: 'src/controllers/authController.js',
    line_number: 45,
    confidence: 98,
    tool: 'semgrep'
  },
  {
    title: 'Password Hashing Weak Algorithm',
    severity: 'high',
    description: 'Using MD5 for password hashing - deprecated and insecure. Should use bcrypt or Argon2.',
    location: 'src/models/User.js',
    line_number: 78,
    confidence: 95,
    tool: 'sonarqube'
  },
  {
    title: 'Missing CSRF Protection',
    severity: 'high',
    description: 'Critical endpoint /api/transfer does not implement CSRF token validation.',
    location: 'src/routes/transfer.js',
    line_number: 123,
    confidence: 92,
    tool: 'semgrep'
  },
  {
    title: 'Weak CORS Policy',
    severity: 'medium',
    description: 'CORS origin set to * allowing any origin to access API.',
    location: 'src/app.js',
    line_number: 67,
    confidence: 90,
    tool: 'semgrep'
  },
  {
    title: 'Unused Dependency: mkdirp',
    severity: 'medium',
    description: 'Package "mkdirp" is imported but never used in codebase.',
    location: 'src/utils/file.js',
    line_number: 15,
    confidence: 88,
    tool: 'sonarqube'
  },
  {
    title: 'Missing HTTPS Headers',
    severity: 'medium',
    description: 'Missing X-Content-Type-Options header - potential XSS risk.',
    location: 'src/app.js',
    line_number: 72,
    confidence: 91,
    tool: 'semgrep'
  },
  {
    title: 'Server Time Information Leak',
    severity: 'low',
    description: 'X-Powered-By header exposes server technology.',
    location: 'src/app.js',
    line_number: 69,
    confidence: 85,
    tool: 'trivy'
  },
  {
    title: 'Hardcoded Database URL',
    severity: 'low',
    description: 'Database connection URL is hardcoded in environment variable configuration.',
    location: 'src/config/db.js',
    line_number: 34,
    confidence: 80,
    tool: 'trivy'
  },
  {
    title: 'TODO Comment',
    severity: 'info',
    description: 'Code has TODO comment: "Implement rate limiting for API endpoints".',
    location: 'src/middleware/rateLimit.js',
    line_number: 89,
    confidence: 75,
    tool: 'sonarqube'
  },
  {
    title: 'Console.log in Production Code',
    severity: 'info',
    description: 'Debug console.log statements found in production code.',
    location: 'src/utils/logger.js',
    line_number: 102,
    confidence: 78,
    tool: 'sonarqube'
  },
  {
    title: 'Deprecated npm Package',
    severity: 'info',
    description: 'Package "lodash" version 4.17.21 is deprecated.',
    location: 'package.json',
    line_number: 18,
    confidence: 95,
    tool: 'trivy'
  },
  {
    title: 'Long Function',
    severity: 'info',
    description: 'Function "processOrder" has 150 lines - consider refactoring.',
    location: 'src/controllers/orderController.js',
    line_number: 456,
    confidence: 70,
    tool: 'sonarqube'
  },
  {
    title: 'Potential Race Condition',
    severity: 'medium',
    description: 'No locking mechanism for shared resource access in file operations.',
    location: 'src/utils/fileHandler.js',
    line_number: 78,
    confidence: 85,
    tool: 'semgrep'
  },
  {
    title: 'Missing Rate Limiting',
    severity: 'high',
    description: 'Login endpoint has no rate limiting - vulnerable to brute force attacks.',
    location: 'src/routes/auth.js',
    line_number: 234,
    confidence: 96,
    tool: 'semgrep'
  },
  {
    title: 'Insecure Random Number Generation',
    severity: 'critical',
    description: 'Using Math.random() for session ID generation - predictable.',
    location: 'src/middleware/session.js',
    line_number: 45,
    confidence: 94,
    tool: 'trivy'
  }
];

async function runRealScan() {
  console.log('🚀 Starting Real Security Scan Test\n');
  console.log('📝 Project: My E-Commerce API');
  console.log('📝 Technologies: Node.js, Express, PostgreSQL');
  console.log('📊 Tools: Semgrep, SonarQube, Trivy\n');

  const scanId = `real-scan-${Date.now()}`;
  const projectName = 'My E-Commerce API';
  const githubRepo = 'user/my-ecommerce-api';

  // Create project
  const projectResult = await pool.query(
    `INSERT INTO projects (id, name, github_repo) VALUES ($1, $2, $3) RETURNING id, created_at`,
    [crypto.randomUUID(), projectName, githubRepo]
  );

  const projectId = projectResult.rows[0].id;
  const project = projectResult.rows[0];

  console.log(`✅ Project created: ${project.name}`);
  console.log(`📊 Project ID: ${projectId}\n`);

  // Insert scan record
  await pool.query(
    `INSERT INTO scans (id, project_id, tool, status, started_at, total_findings)
     VALUES ($1, $2, 'combined', 'processing', NOW(), $3)`,
    [scanId, projectId, realisticFindings.length]
  );

  console.log(`📋 Scan ID: ${scanId}`);
  console.log(`🔍 Total findings: ${realisticFindings.length}\n`);

  // Process findings
  const processedFindings = [];
  for (let i = 0; i < realisticFindings.length; i++) {
    const finding = realisticFindings[i];
    const findingId = crypto.randomUUID();

    console.log(`[${i + 1}/${realisticFindings.length}] Processing: ${finding.title}`);
    console.log(`   Severity: ${finding.severity.toUpperCase()}`);
    console.log(`   Location: ${finding.location}:${finding.line_number}`);

    // Store in database
    await pool.query(
      `INSERT INTO findings (
        id, project_id, scan_id, tool, severity, title, description,
        location, line_number, confidence, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        findingId,
        projectId,
        scanId,
        finding.tool,
        finding.severity,
        finding.title,
        finding.description,
        finding.location,
        finding.line_number,
        finding.confidence,
        'open'
      ]
    );

    processedFindings.push({
      ...finding,
      id: findingId,
      status: 'open'
    });

    console.log(`   ✅ Stored in database\n`);
  }

  // Update scan status
  const severityCounts = {};
  realisticFindings.forEach(f => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
  });

  await pool.query(
    `UPDATE scans
     SET status = 'completed',
         completed_at = NOW(),
         high_severity = $1,
         medium_severity = $2,
         low_severity = $3,
         info_severity = $4
     WHERE id = $5`,
    [
      severityCounts.high || 0,
      severityCounts.medium || 0,
      severityCounts.low || 0,
      severityCounts.info || 0,
      scanId
    ]
  );

  // AI Analysis (will use mock AI service)
  console.log('🤖 Running AI Analysis...\n');
  const { analyzeFindingsWithAI } = await import('../src/ai-service.js');
  const analyzedFindings = await analyzeFindingsWithAI(processedFindings);

  console.log('✅ AI Analysis completed\n');

  // Generate Statistics
  const severityStats = {};
  analyzedFindings.forEach(f => {
    const sev = f.severity.toUpperCase();
    severityStats[sev] = (severityStats[sev] || 0) + 1;
  });

  console.log('📊 SCAN RESULTS SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Project: ${project.name}`);
  console.log(`GitHub: ${githubRepo}`);
  console.log(`Scan ID: ${scanId}`);
  console.log(`Total Findings: ${analyzedFindings.length}`);
  console.log('');

  Object.entries(severityStats).sort((a, b) => {
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  }).forEach(([severity, count]) => {
    const color = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : severity === 'LOW' ? '🔵' : '⚪';
    console.log(`${color} ${severity}: ${count}`);
  });

  console.log('');
  console.log('🎯 TOP 5 CRITICAL/HIGH PRIORITY FINDINGS');
  console.log('═'.repeat(60));

  const criticalHigh = analyzedFindings
    .filter(f => ['critical', 'high'].includes(f.severity))
    .sort((a, b) => b.ai_priority_score - a.ai_priority_score)
    .slice(0, 5);

  criticalHigh.forEach((finding, i) => {
    console.log(`\n${i + 1}. ${finding.title}`);
    console.log(`   Severity: ${finding.severity.toUpperCase()}`);
    console.log(`   Priority Score: ${finding.ai_priority_score}/100`);
    console.log(`   Group ID: ${finding.ai_group_id}`);
    console.log(`   Location: ${finding.location}:${finding.line_number}`);
    console.log(`   Recommendations:`);
    finding.ai_recommendations.forEach(rec => {
      console.log(`     • ${rec}`);
    });
  });

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Scan completed successfully!');
  console.log('🔗 Dashboard: http://localhost:3000/api/projects');
  console.log('📄 Report: http://localhost:3000/api/projects/' + projectId + '/reports/pdf\n');

  // Close database connection
  await pool.end();
}

runRealScan().catch(console.error);
