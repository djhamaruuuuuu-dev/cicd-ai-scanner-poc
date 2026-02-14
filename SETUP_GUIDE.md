# Setup Guide - AI-Powered CI/CD Security Scanner

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 12+ installed
- [ ] AI API key ready (z.ai/OpenRouter)
- [ ] Git account configured

---

## 🚀 Step 1: Clone Repository

```bash
cd /root/.openclaw/workspace
git clone https://github.com/djhamaruuuuuu-dev/cicd-ai-scanner-poc.git
cd cicd-ai-scanner-poc
```

---

## 🔧 Step 2: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 183 packages in 53s
found 0 vulnerabilities
```

---

## 💾 Step 3: Setup PostgreSQL Database

### On Linux (OpenCloudOS/Ubuntu):
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE cicd_scanner;"

# Verify
sudo -u postgres psql -c "\l" | grep cicd_scanner
```

### On macOS:
```bash
brew services start postgresql
createdb cicd_scanner
```

### On Windows:
```bash
# Using pgAdmin or SQL Shell:
CREATE DATABASE cicd_scanner;
```

---

## ⚙️ Step 4: Configure Environment

Edit `.env` file:

```bash
nano .env
```

**Required settings:**
```env
PORT=3000
NODE_ENV=development

# Database (adjust credentials as needed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cicd_scanner
DB_USER=postgres
DB_PASSWORD=postgres

# AI Provider - z.ai / OpenRouter
# Note: The API key provided is for OpenRouter
ZAI_API_KEY=03eae3d0f6624950977892b470065dfd.vPJQ8KGPV6FL7CMW
ZAI_BASE_URL=https://openrouter.ai/api/v1

# GitHub Integration (optional)
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_secret_here

# CORS
CORS_ORIGIN=http://localhost:3000
```

**⚠️ Security Note:** In production, use strong passwords and don't expose `.env` file.

---

## 🗄️ Step 5: Initialize Database Schema

```bash
node src/setup-db.js
```

**Expected output:**
```
📊 Setting up database...
✅ Database setup completed!
📝 Tables created: projects, findings, scans
```

**Verify tables created:**
```bash
sudo -u postgres psql -d cicd_scanner -c "\dt"
```

---

## 🎯 Step 6: Start the Server

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

**Expected output:**
```
🚀 Starting server...
✅ Database connected

🦊 AI-Powered CI/CD Security Scanner
📊 Server running on port 3000
🔗 Health check: http://localhost:3000/health
🌐 API documentation: http://localhost:3000/
```

---

## ✅ Step 7: Verify Installation

### Test Health Check:
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2026-02-14T15:22:31.051Z"}
```

### Test API Root:
```bash
curl http://localhost:3000/
```

**Expected:**
```json
{
  "name": "AI-Powered CI/CD Security Scanner",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "webhooks": "/api/webhooks/:tool",
    "reports": "/api/reports/:projectId/:commit",
    "dashboard": "/dashboard"
  }
}
```

---

## 🧪 Step 8: Run Test Scans

```bash
node tests/test-webhook.js
```

**Expected output:**
```
🧪 Testing Webhook Integration

📤 Sending to Semgrep...
✅ Semgrep webhook received

📤 Sending to SonarQube...
✅ SonarQube webhook received

📤 Sending to Trivy...
✅ Trivy webhook received

⏳ Waiting for AI analysis...

📋 Testing API endpoints

✅ Projects: 1 project(s) found
   - Project ID: 7154d3f2-abf9-4578-bb61-b5b8d17ff884
   - Name: Test Project
   - GitHub: test-org/test-repo

✅ Test completed successfully!
```

---

## 📊 Step 9: Access Data

### View Projects:
```bash
curl http://localhost:3000/api/projects
```

### View Dashboard Stats:
```bash
curl http://localhost:3000/api/dashboard/stats
```

### View Findings:
```bash
curl http://localhost:3000/api/projects/7154d3f2-abf9-4578-bb61-b5b8d17ff884/scans/scan-1771082580231/findings
```

### Generate PDF Report:
```bash
curl -o report.pdf http://localhost:3000/api/projects/7154d3f2-abf9-4578-bb61-b5b8d17ff884/reports/pdf
```

---

## 🔌 Step 10: Integrate with CI/CD

### Example: GitHub Actions Workflow

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          docker run --rm -v $PWD:/app returntocorp/semgrep:latest semgrep --json --output semgrep-results.json .

      - name: Run SonarQube Scanner
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        run: |
          docker run --rm -v $PWD:/usr/src/sonar-project \
            sonarsource/sonar-scanner-cli \
            -Dsonar.projectKey=my-project \
            -Dsonar.sources=. \
            -Dsonar.host.url=https://sonarqube.example.com \
            -Dsonar.login=${{ secrets.SONAR_TOKEN }}

      - name: Run Trivy Scan
        run: |
          docker run --rm -v $PWD:/root/.cache/trivy \
            aquasec/trivy:latest filesystem /root/.cache/trivy --format json --output trivy-results.json

      - name: Send to AI Scanner Webhook
        uses: fjogele/nightwatch-action@master
        with:
          httpMethod: POST
          headers: '{"Content-Type":"application/json"}'
          url: 'http://localhost:3000/api/webhooks/semgrep'
          body: |
            {
              "scan_id": "${{ github.sha }}",
              "project_name": "${{ github.repository }}",
              "github_repo": "${{ github.repository }}",
              "findings": [
                $(cat semgrep-results.json | jq -c '.results[] | {
                  title: .checkId,
                  severity: .severity,
                  description: .message,
                  location: .checkId,
                  line_number: .start.line,
                  confidence: 95,
                  tool: "semgrep"
                }' | paste -sd, -)
              ]
            }
```

---

## 🎨 Step 11: Build Web Dashboard (Optional)

```bash
# Install dashboard dependencies
npm install express-ejs-layouts ejs

# Create dashboard.html
# (See /src/routes/api.js for API endpoints)

# Access at http://localhost:3000/dashboard
```

---

## 🐛 Troubleshooting

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep cicd_scanner

# Reset database
sudo -u postgres psql -d postgres -c "DROP DATABASE cicd_scanner;"
sudo -u postgres psql -c "CREATE DATABASE cicd_scanner;"
cd /root/.openclaw/workspace/cicd-ai-scanner-poc && node src/setup-db.js
```

### Issue: Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=8080 npm start
```

### Issue: AI Analysis returns 404/502
- Check `ZAI_BASE_URL` in `.env`
- Verify API key is valid
- Test API endpoint manually:
  ```bash
  curl -H "Authorization: Bearer YOUR_API_KEY" \
    https://openrouter.ai/api/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"test"}]}'
  ```

### Issue: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- **API Documentation:** See `API_DOCUMENTATION.md`
- **GitHub Repository:** https://github.com/djhamaruuuuuu-dev/cicd-ai-scanner-poc
- **Issues:** Open an issue on GitHub for help

---

## 🎯 Quick Start (3-Step)

If you want to get running quickly:

```bash
# 1. Install and setup (5 minutes)
npm install
sudo -u postgres psql -c "CREATE DATABASE cicd_scanner;"
node src/setup-db.js

# 2. Start server (1 second)
npm start

# 3. Test (30 seconds)
node tests/test-webhook.js
curl http://localhost:3000/health
```

You're ready! 🚀
