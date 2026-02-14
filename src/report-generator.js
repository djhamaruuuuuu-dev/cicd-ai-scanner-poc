import PDFDocument from 'pdfkit';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cicd_scanner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

export async function generatePDFReport({ project, findings, date }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  let buffer = [];

  doc.on('data', (chunk) => buffer.push(chunk));

  // Add project info
  doc.fontSize(24).font('Helvetica-Bold').text(project.name || 'Security Report', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text(`GitHub: ${project.github_repo || 'N/A'}`, { align: 'center' });
  doc.moveDown(2);

  // Add date
  doc.fontSize(10).text(`Generated: ${date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, { align: 'right' });

  doc.moveDown(2);

  // Statistics
  doc.fontSize(14).font('Helvetica-Bold').text('📊 Statistics', { underline: true });
  doc.moveDown();

  const stats = {
    'Total Findings': findings.length,
    'Critical': findings.filter(f => f.severity === 'critical').length,
    'High': findings.filter(f => f.severity === 'high').length,
    'Medium': findings.filter(f => f.severity === 'medium').length,
    'Low': findings.filter(f => f.severity === 'low').length
  };

  Object.entries(stats).forEach(([label, value]) => {
    doc.fontSize(11).font('Helvetica').text(`${label}: ${value}`);
  });

  doc.moveDown(1.5);

  // Findings
  doc.fontSize(14).font('Helvetica-Bold').text('🔧 Security Findings', { underline: true });
  doc.moveDown();

  const severityColors = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: '⚪'
  };

  findings.forEach((finding, index) => {
    const indent = '  ';
    const marker = severityColors[finding.severity] || '⚪';

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`${marker} ${index + 1}. ${finding.title}`, { indent: indent });

    doc.fontSize(10).font('Helvetica');
    doc.text(`Severity: ${finding.severity.toUpperCase()}`, { indent: '  ' + indent });

    if (finding.description) {
      doc.text(`Description: ${finding.description}`, { indent: '  ' + indent });
    }

    if (finding.location) {
      doc.text(`Location: ${finding.location}`, { indent: '  ' + indent });
    }

    if (finding.line_number) {
      doc.text(`Line: ${finding.line_number}`, { indent: '  ' + indent });
    }

    doc.moveDown(0.5);
  });

  // Add watermark
  doc.fontSize(100).font('Helvetica').fillColor('#f0f0f0').text(
    'CONFIDENTIAL',
    { align: 'center', width: doc.page.width }
  );

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffer));
    });
    doc.on('error', reject);
  });
}

export async function generateHTMLReport({ project, findings }) {
  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#2563eb',
    info: '#6b7280'
  };

  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Security Report - ${project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .stats { display: flex; gap: 20px; margin: 30px 0; }
    .stat { background: #f5f5f5; padding: 15px 20px; border-radius: 8px; }
    .stat strong { display: block; font-size: 24px; }
    .finding { margin: 20px 0; padding: 15px; border-left: 4px solid ${severityColors['medium']}; background: #fafafa; }
    .finding.critical { border-left-color: ${severityColors['critical']}; }
    .finding.high { border-left-color: ${severityColors['high']}; }
    .finding.medium { border-left-color: ${severityColors['medium']}; }
    .finding.low { border-left-color: ${severityColors['low']}; }
    .severity { font-weight: bold; text-transform: uppercase; }
  </style>
</head>
<body>
  <h1>🔍 Security Report - ${project.name}</h1>
  <p><strong>GitHub:</strong> ${project.github_repo || 'N/A'}</p>
  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

  <div class="stats">
    <div class="stat">
      <strong>${findings.length}</strong>
      <span>Total Findings</span>
    </div>
    <div class="stat">
      <strong>${findings.filter(f => f.severity === 'critical').length}</strong>
      <span>Critical</span>
    </div>
    <div class="stat">
      <strong>${findings.filter(f => f.severity === 'high').length}</strong>
      <span>High</span>
    </div>
    <div class="stat">
      <strong>${findings.filter(f => f.severity === 'medium').length}</strong>
      <span>Medium</span>
    </div>
  </div>

  <h2>📋 Findings</h2>
  ${findings.map((finding, i) => `
    <div class="finding ${finding.severity}">
      <div style="color: ${severityColors[finding.severity]}; font-weight: bold;">
        ${i + 1}. ${finding.title} <span class="severity">${finding.severity.toUpperCase()}</span>
      </div>
      <p><strong>Description:</strong> ${finding.description || 'N/A'}</p>
      <p><strong>Location:</strong> ${finding.location || 'N/A'}</p>
      <p><strong>Line:</strong> ${finding.line_number || 'N/A'}</p>
    </div>
  `).join('')}
</body>
</html>
  `;

  return html;
}
