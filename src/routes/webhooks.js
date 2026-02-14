import express from 'express';
import { Pool } from 'pg';
import { analyzeFindingsWithAI } from './ai-service.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cicd_scanner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Webhook handler for various scanning tools
router.post('/:tool', async (req, res) => {
  try {
    const tool = req.params.tool;
    const payload = req.body;
    const scanId = payload.scan_id || `scan-${Date.now()}`;

    console.log(`📥 Received webhook from: ${tool}`);
    console.log(`📝 Scan ID: ${scanId}`);

    if (!payload.findings || !Array.isArray(payload.findings)) {
      return res.status(400).json({ error: 'No findings in payload' });
    }

    // Get or create project
    const project = await pool.query(
      'SELECT id, github_repo FROM projects WHERE github_repo = $1',
      [payload.github_repo || 'default']
    );

    let projectId;
    if (project.rows.length === 0) {
      const newProject = await pool.query(
        'INSERT INTO projects (id, name, github_repo) VALUES ($1, $2, $3) RETURNING id',
        [crypto.randomUUID(), payload.project_name || 'Unnamed Project', payload.github_repo || 'default']
      );
      projectId = newProject.rows[0].id;
    } else {
      projectId = project.rows[0].id;
    }

    // Insert scan record
    await pool.query(
      `INSERT INTO scans (id, project_id, tool, status, started_at, total_findings)
       VALUES ($1, $2, $3, 'processing', NOW(), $4)`,
      [scanId, projectId, tool, payload.findings.length]
    );

    // Store findings
    const findingsToAnalyze = [];
    for (const finding of payload.findings) {
      const findingId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO findings (
          id, project_id, scan_id, tool, severity, title, description,
          location, line_number, confidence, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          findingId,
          projectId,
          scanId,
          tool,
          finding.severity || 'medium',
          finding.title || 'Unknown',
          finding.description || '',
          finding.location || '',
          finding.line_number || null,
          finding.confidence || 70,
          'open'
        ]
      );

      findingsToAnalyze.push({
        id: findingId,
        tool,
        severity: finding.severity || 'medium',
        title: finding.title || 'Unknown',
        description: finding.description || '',
        location: finding.location || '',
        line_number: finding.line_number || null,
        confidence: finding.confidence || 70
      });
    }

    // Update scan status
    await pool.query(
      `UPDATE scans
       SET status = 'completed', completed_at = NOW(),
           high_severity = (SELECT COUNT(*) FROM findings WHERE scan_id = $1 AND severity = 'high'),
           medium_severity = (SELECT COUNT(*) FROM findings WHERE scan_id = $1 AND severity = 'medium'),
           low_severity = (SELECT COUNT(*) FROM findings WHERE scan_id = $1 AND severity = 'low'),
           info_severity = (SELECT COUNT(*) FROM findings WHERE scan_id = $1 AND severity = 'info')
       WHERE id = $1`,
      [scanId]
    );

    // Analyze findings with AI (async)
    analyzeFindingsWithAI(findingsToAnalyze).catch(err => {
      console.error('AI Analysis failed:', err);
    });

    console.log(`✅ Processed ${payload.findings.length} findings from ${tool}`);
    res.status(200).json({ success: true, scanId, findingsCount: payload.findings.length });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
