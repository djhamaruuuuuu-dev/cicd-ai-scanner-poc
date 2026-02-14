import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ZAI_API_KEY = process.env.ZAI_API_KEY;
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/v1';

const ZAI_PROMPT = `You are a security expert AI assistant. Analyze the following vulnerability findings and provide structured recommendations.

TOOL: {tool_name}
SEVERITY: {severity}
TITLE: {title}
DESCRIPTION: {description}
LOCATION: {file}:{line_number}
CONFIDENCE: {confidence}/100

Provide the following JSON output:

{
  "confidence_score": 85,
  "recommendations": [
    "Specific fix recommendation 1",
    "Specific fix recommendation 2"
  ],
  "business_impact": "high|medium|low",
  "group_id": "Group this finding with similar issues"
}

Rules:
- confidence_score: 1-100 (how confident you are this is a real issue)
- business_impact: high, medium, or low
- group_id: Create a short group identifier (max 30 chars)
- recommendations: 2-4 concrete, actionable bullet points`;

export async function analyzeFindingsWithAI(findings) {
  try {
    const prompt = findings.map(f => {
      const severityColors = { 'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🔵', 'info': '⚪' };
      return `
${severityColors[f.severity] || '⚪'} ${f.tool} - ${f.title}
Severity: ${f.severity}
Description: ${f.description || 'N/A'}
Location: ${f.location || 'N/A'}
Line: ${f.line_number || 'N/A'}
Confidence: ${f.confidence}/100`;
    }).join('\n\n---\n\n');

    const systemPrompt = `You are a security expert AI. Analyze these vulnerability findings and provide structured JSON output.

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text.`;

    const response = await axios.post(
      `${ZAI_BASE_URL}/chat/completions`,
      {
        model: 'claude-3.5-sonnet', // atau model yang tersedia di z.ai
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${ZAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log(`🤖 AI Analysis completed for ${findings.length} findings`);

    return JSON.parse(aiResponse);

  } catch (error) {
    console.error('❌ AI Analysis error:', error.response?.data || error.message);
    // Fallback to deterministic recommendations
    return {
      confidence_score: 50,
      recommendations: ['Manual review recommended', 'Review original scanner output'],
      business_impact: 'medium',
      group_id: 'manual-review'
    };
  }
}

export async function analyzeSingleFinding(finding) {
  try {
    const prompt = ZAI_PROMPT.replace('{tool_name}', finding.tool)
      .replace('{severity}', finding.severity)
      .replace('{title}', finding.title)
      .replace('{description}', finding.description || 'N/A')
      .replace('{file}', finding.location?.split(':')[0] || 'N/A')
      .replace('{line_number}', finding.line_number || 'N/A')
      .replace('{confidence}', finding.confidence);

    const response = await axios.post(
      `${ZAI_BASE_URL}/chat/completions`,
      {
        model: 'claude-3.5-sonnet',
        messages: [
          { role: 'system', content: 'You are a security expert. Return ONLY JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${ZAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);

  } catch (error) {
    console.error('❌ AI Analysis error:', error.message);
    return {
      confidence_score: 50,
      recommendations: ['Manual review recommended'],
      business_impact: 'medium',
      group_id: 'manual-review'
    };
  }
}
