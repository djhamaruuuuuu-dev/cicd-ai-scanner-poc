import express from 'express';
import { Pool } from 'pg';
import { generatePDFReport } from '../report-generator.js';
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

// Get project list
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.total_findings, s.high_severity, s.medium_severity
      FROM projects p
      LEFT JOIN (
        SELECT project_id, COUNT(*) as total_findings,
               COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
               COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity
        FROM findings
        GROUP BY project_id
      ) s ON p.id = s.project_id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get scan history for a project
router.get('/projects/:projectId/scans', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(`
      SELECT * FROM scans
      WHERE project_id = $1
      ORDER BY started_at DESC
      LIMIT 50
    `, [projectId]);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// Get detailed findings for a scan
router.get('/projects/:projectId/scans/:scanId/findings', async (req, res) => {
  try {
    const { projectId, scanId } = req.params;
    const result = await pool.query(`
      SELECT * FROM findings
      WHERE project_id = $1 AND scan_id = $2
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          WHEN 'info' THEN 5
        END,
        confidence DESC
    `, [projectId, scanId]);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching findings:', error);
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

// Generate PDF report
router.get('/projects/:projectId/reports/pdf', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { scanId } = req.query;

    console.log(`📄 Generating PDF report for project ${projectId}`);

    // Get project details
    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get findings
    let findingsQuery = 'SELECT * FROM findings WHERE project_id = $1';
    const queryParams = [projectId];
    if (scanId) {
      findingsQuery += ' AND scan_id = $2';
      queryParams.push(scanId);
    }

    const findingsResult = await pool.query(findingsQuery, queryParams);

    // Generate PDF
    const pdfBuffer = await generatePDFReport({
      project: project.rows[0],
      findings: findingsResult.rows,
      date: new Date()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.rows[0].name}_security_report.pdf"`);
    res.send(pdfBuffer);

    console.log(`✅ PDF report generated for ${findingsResult.rows.length} findings`);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalProjects = await pool.query('SELECT COUNT(*) FROM projects');
    const totalScans = await pool.query('SELECT COUNT(*) FROM scans');
    const criticalIssues = await pool.query('SELECT COUNT(*) FROM findings WHERE severity = \'critical\'');
    const highIssues = await pool.query('SELECT COUNT(*) FROM findings WHERE severity = \'high\'');

    res.json({
      projects: totalProjects.rows[0].count,
      scans: totalScans.rows[0].count,
      criticalIssues: criticalIssues.rows[0].count,
      highIssues: highIssues.rows[0].count
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
