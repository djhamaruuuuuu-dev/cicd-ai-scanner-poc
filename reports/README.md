# Security Reports

This directory contains generated security scan reports from the AI-Powered CI/CD Security Scanner.

## Available Reports

- **cicd-security-report.pdf** - Sample security report with 15 findings from test scans

## Generating Reports

Generate a new PDF report using the API:

```bash
curl -o report.pdf http://localhost:3000/api/projects/PROJECT_ID/reports/pdf
```

Or use the PDF generation endpoint in the dashboard.
