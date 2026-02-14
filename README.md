# AI-Powered CI/CD Security Scanner - POC

A proof-of-concept system that consolidates security scan results from multiple tools (SonarQube, Trivy, Semgrep) and provides AI-powered recommendations using z.ai.

## 🎯 Features

- **Multi-tool integration**: SonarQube, Trivy, Semgrep
- **AI-powered analysis**: Automated vulnerability assessment with recommendations
- **Unified dashboard**: Single view of all security findings
- **PDF report generation**: Professional security reports
- **Webhook-based**: Real-time scan result processing
- **Database storage**: Persistent findings with analytics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- z.ai API Key

### Installation

```bash
# Clone or navigate to project
cd cicd-ai-scanner-poc

# Install dependencies
npm install

# Setup database
createdb cicd_scanner
psql -d cicd_scanner -f src/setup-db.js

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on port 3000.

## 📡 Usage

### Webhook Integration

Send scan results to any of these endpoints:

```
POST /api/webhooks/semgrep
POST /api/webhooks/sonarqube
POST /api/webhooks/trivy
```

### Example Payload

```json
{
  "scan_id": "scan-12345",
  "project_name": "My Project",
  "github_repo": "my-org/my-repo",
  "findings": [
    {
      "title": "SQL Injection Vulnerability",
      "severity": "critical",
      "description": "SQL injection detected",
      "location": "src/controllers/auth.js",
      "line_number": 45,
      "confidence": 95,
      "tool": "semgrep"
    }
  ]
}
```

### Dashboard API

- Get all projects: `GET /api/projects`
- Get scan history: `GET /api/projects/:projectId/scans`
- Get findings: `GET /api/projects/:projectId/scans/:scanId/findings`
- Generate PDF: `GET /api/projects/:projectId/reports/pdf?scanId=xxx`

## 🧪 Testing

Run the test script to simulate a scan:

```bash
node tests/scan-repo.js
```

This will:
1. Start a mock webhook server
2. Simulate scan results from 3 tools
3. Send them to the webhook endpoints
4. Show processing results

## 📊 Data Structure

### Projects
- Project metadata and GitHub repository link

### Findings
- Scan ID, tool, severity
- Title, description, location
- Line number, confidence score
- AI analysis (recommendations, priority score)

### Scans
- Scan status and timing
- Severity breakdown
- Tool information

## 🔒 Security

- Helmet.js for HTTP headers
- Rate limiting on API endpoints
- CORS configuration
- Webhook signature verification (TODO)

## 📝 API Documentation

After starting the server, visit:
- Root: `http://localhost:3000/`
- Health: `http://localhost:3000/health`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🤖 AI Integration

Uses z.ai API for:
- Confidence scoring
- Business impact assessment
- Concrete fix recommendations
- Finding grouping

## 📧 Support

For issues or questions, open an issue on GitHub.
