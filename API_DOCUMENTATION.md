# API Documentation

## Base URL
`http://localhost:3000`

## Authentication
Currently, all endpoints are public. For production, implement authentication/authorization.

---

## Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T15:22:31.051Z"
}
```

---

### 2. Webhook Integration

#### Semgrep Webhook
```http
POST /api/webhooks/semgrep
Content-Type: application/json
```

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "scanId": "scan-12345",
  "findingsCount": 5
}
```

#### SonarQube Webhook
```http
POST /api/webhooks/sonarqube
```

Same structure as Semgrep, but findings are marked with tool="sonarqube".

#### Trivy Webhook
```http
POST /api/webhooks/trivy
```

Same structure as Semgrep, but findings are marked with tool="trivy".

---

### 3. Projects API

#### Get All Projects
```http
GET /api/projects
```

**Response:**
```json
[
  {
    "id": "7154d3f2-abf9-4578-bb61-b5b8d17ff884",
    "name": "Test Project",
    "github_repo": "test-org/test-repo",
    "created_at": "2026-02-14T15:22:31.051Z",
    "total_findings": 5,
    "high_severity": 1,
    "medium_severity": 2
  }
]
```

---

### 4. Scans API

#### Get Scan History
```http
GET /api/projects/:projectId/scans
```

**Response:**
```json
[
  {
    "id": "scan-12345",
    "project_id": "7154d3f2-abf9-4578-bb61-b5b8d17ff884",
    "tool": "semgrep",
    "status": "completed",
    "started_at": "2026-02-14T15:22:31.051Z",
    "completed_at": "2026-02-14T15:22:36.051Z",
    "total_findings": 5,
    "high_severity": 1,
    "medium_severity": 2,
    "low_severity": 1,
    "info_severity": 1
  }
]
```

#### Get Findings for Scan
```http
GET /api/projects/:projectId/scans/:scanId/findings
```

**Response:**
```json
[
  {
    "id": "finding-123",
    "project_id": "7154d3f2-abf9-4578-bb61-b5b8d17ff884",
    "scan_id": "scan-12345",
    "tool": "semgrep",
    "severity": "critical",
    "title": "SQL Injection Vulnerability",
    "description": "SQL injection detected",
    "location": "src/controllers/auth.js",
    "line_number": 45,
    "confidence": 95,
    "status": "open",
    "ai_analysis": "Structured analysis...",
    "ai_recommendations": ["Recommendation 1", "Recommendation 2"],
    "ai_priority_score": 85,
    "ai_group_id": "sql-injection-group",
    "created_at": "2026-02-14T15:22:31.051Z"
  }
]
```

---

### 5. Reports API

#### Generate PDF Report
```http
GET /api/projects/:projectId/reports/pdf?scanId=scan-12345
```

**Response:** PDF file (binary)

**Header:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Project_Security_Report.pdf"
```

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "projects": 1,
  "scans": 3,
  "criticalIssues": 1,
  "highIssues": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "No findings in payload"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## cURL Examples

### Send Semgrep Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/semgrep \
  -H "Content-Type: application/json" \
  -d '{
    "scan_id": "scan-12345",
    "project_name": "My Project",
    "github_repo": "my-org/my-repo",
    "findings": [
      {
        "title": "SQL Injection",
        "severity": "critical",
        "description": "SQLi detected",
        "location": "auth.js:45",
        "line_number": 45,
        "confidence": 95,
        "tool": "semgrep"
      }
    ]
  }'
```

### Get All Projects
```bash
curl http://localhost:3000/api/projects
```

### Get Dashboard Stats
```bash
curl http://localhost:3000/api/dashboard/stats
```

### Generate PDF Report
```bash
curl -o report.pdf http://localhost:3000/api/projects/7154d3f2-abf9-4578-bb61-b5b8d17ff884/reports/pdf
```

---

## Data Flow

1. **Scan Tools** → Send webhook to `/api/webhooks/:tool`
2. **Consolidation Service** → Store findings in database
3. **AI Service** → Analyze findings (async)
4. **Report Generation** → PDF/HTML reports via API

---

## Rate Limiting

- API endpoints are rate limited to 100 requests per 15 minutes per IP
- Webhooks are exempt from rate limiting

---

## CORS Configuration

By default, all origins are allowed. Configure in `.env`:
```
CORS_ORIGIN=http://localhost:3000
```
