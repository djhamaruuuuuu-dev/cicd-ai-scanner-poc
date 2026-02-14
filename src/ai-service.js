import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ZAI_API_KEY = process.env.ZAI_API_KEY;
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions';

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
      ZAI_BASE_URL,
      {
        model: 'glm-4-7-251222',
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
        },
        timeout: 30000
      }
    );

    let aiResponse = response.data.choices[0].message.content;

    // Strip markdown code blocks if present
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    console.log(`🤖 AI Analysis completed for ${findings.length} findings`);
    console.log(`📋 AI Confidence: ${JSON.parse(aiResponse).confidence_score || 70}%`);

    return JSON.parse(aiResponse);

  } catch (error) {
    console.error('❌ AI Analysis error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.error('❌ Authentication failed - Invalid API key');
      console.error('💡 Check ZAI_API_KEY in .env file');
    } else if (error.response?.status === 502 || error.response?.status === 503) {
      console.error('❌ AI service unavailable - Service error');
      console.error('💡 Try again in a few minutes or check API status');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to AI service');
      console.error('💡 Check ZAI_BASE_URL in .env file');
    }

    return generateFallbackAnalysis(findings);
  }
}

function generateFallbackAnalysis(findings) {
  console.log('📋 Using fallback analysis (deterministic recommendations)');

  const recommendations = findings.map(finding => {
    const severity = finding.severity?.toLowerCase() || 'medium';
    return generateSeverityRecommendation(severity, finding.title);
  });

  return {
    confidence_score: 70,
    recommendations: recommendations,
    business_impact: calculateBusinessImpact(findings),
    group_id: 'auto-grouped'
  };
}

function generateSeverityRecommendation(severity, title) {
  const recommendations = {
    critical: [
      `CRITICAL: ${title} - Immediate attention required`,
      '🚨 Stop development until this is fixed',
      'Review code immediately and implement remediation',
      'Test in staging environment first',
      'Document the issue and communicate to stakeholders'
    ],
    high: [
      `HIGH: ${title} - Fix in next sprint`,
      '🟠 Address this vulnerability as soon as possible',
      'Implement recommended fixes from scanner',
      'Review related code for similar issues',
      'Schedule follow-up review'
    ],
    medium: [
      `MEDIUM: ${title} - Plan for fix`,
      '🔵 Add to backlog for upcoming sprint',
      'Implement standard security practices',
      'Consider refactoring for long-term fix',
      'Monitor for similar patterns'
    ],
    low: [
      `LOW: ${title} - Improve in next iteration`,
      '⚪ Add to technical debt list',
      'Consider improving code quality',
      'Review in next code review cycle'
    ],
    info: [
      `INFO: ${title} - Nice to have improvement`,
      '⚪ Consider as enhancement',
      'Can be addressed during code cleanup'
    ]
  };

  return recommendations[severity]?.join('\n') || recommendations.medium.join('\n');
}

function calculateBusinessImpact(findings) {
  const criticalCount = findings.filter(f => f.severity?.toLowerCase() === 'critical').length;
  const highCount = findings.filter(f => f.severity?.toLowerCase() === 'high').length;

  if (criticalCount > 0) return 'high';
  if (highCount > 2) return 'high';
  if (highCount > 0) return 'medium';
  return 'low';
}

export async function analyzeSingleFinding(finding) {
  try {
    const prompt = `TOOL: ${finding.tool}
SEVERITY: ${finding.severity}
TITLE: ${finding.title}
DESCRIPTION: ${finding.description || 'N/A'}
LOCATION: ${finding.location?.split(':')[0] || 'N/A'}
LINE: ${finding.line_number || 'N/A'}
CONFIDENCE: ${finding.confidence}/100

Provide JSON: { "confidence_score": 1-100, "recommendations": ["fix 1", "fix 2"], "business_impact": "high|medium|low", "group_id": "short-id" }`;

    const response = await axios.post(
      ZAI_BASE_URL,
      {
        model: 'glm-4-7-251222',
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
        },
        timeout: 30000
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
