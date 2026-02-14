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

async function setupDatabase() {
  try {
    console.log('📊 Setting up database...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        github_repo VARCHAR(255) NOT NULL,
        github_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS findings (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) REFERENCES projects(id),
        scan_id VARCHAR(255),
        tool VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        location VARCHAR(500),
        line_number INTEGER,
        confidence INTEGER,
        status VARCHAR(20) DEFAULT 'open',
        ai_analysis TEXT,
        ai_recommendations TEXT[],
        ai_priority_score INTEGER,
        ai_group_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) REFERENCES projects(id),
        tool VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        total_findings INTEGER,
        high_severity INTEGER,
        medium_severity INTEGER,
        low_severity INTEGER,
        info_severity INTEGER
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_findings_project_id ON findings(project_id);
      CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
      CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
    `);

    console.log('✅ Database setup completed!');
    console.log('📝 Tables created: projects, findings, scans');

  } catch (error) {
    console.error('❌ Database setup error:', error);
    process.exit(1);
  }
}

export { setupDatabase };

setupDatabase();
