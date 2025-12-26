// DevOps AI Service - AI for Technical Operations
// خدمة الذكاء الاصطناعي للعمليات الفنية

import { PrismaClient } from '@prisma/client';
import { HfInference } from '@huggingface/inference';

const prisma = new PrismaClient();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  requests: number;
  errors: number;
  latency: number;
}

interface CodeAnalysis {
  quality: number;
  issues: string[];
  suggestions: string[];
  security: string[];
}

export class DevOpsAIService {
  // ==========================================
  // 🔧 INFRASTRUCTURE MONITORING
  // ==========================================

  // Analyze system health and predict issues
  async analyzeSystemHealth(metrics: SystemMetrics): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    predictions: string[];
    recommendations: string[];
    autoActions: string[];
  }> {
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const predictions: string[] = [];
    const recommendations: string[] = [];
    const autoActions: string[] = [];

    // CPU Analysis
    if (metrics.cpu > 90) {
      status = 'critical';
      predictions.push('CPU overload imminent - service degradation expected');
      recommendations.push('Scale horizontally or optimize CPU-intensive operations');
      autoActions.push('SCALE_UP_INSTANCES');
    } else if (metrics.cpu > 70) {
      status = 'warning';
      predictions.push('CPU usage trending high');
      recommendations.push('Monitor closely, prepare scaling plan');
    }

    // Memory Analysis
    if (metrics.memory > 85) {
      status = 'critical';
      predictions.push('Memory exhaustion risk - OOM killer may trigger');
      recommendations.push('Increase memory or fix memory leaks');
      autoActions.push('RESTART_HIGH_MEMORY_PODS');
    } else if (metrics.memory > 70) {
      if (status !== 'critical') status = 'warning';
      predictions.push('Memory usage elevated');
    }

    // Error Rate Analysis
    const errorRate = metrics.errors / metrics.requests * 100;
    if (errorRate > 5) {
      status = 'critical';
      predictions.push(`High error rate: ${errorRate.toFixed(2)}%`);
      recommendations.push('Investigate error logs immediately');
      autoActions.push('ENABLE_CIRCUIT_BREAKER');
    } else if (errorRate > 1) {
      if (status !== 'critical') status = 'warning';
      predictions.push(`Elevated error rate: ${errorRate.toFixed(2)}%`);
    }

    // Latency Analysis
    if (metrics.latency > 2000) {
      if (status !== 'critical') status = 'warning';
      predictions.push('High latency detected - user experience impacted');
      recommendations.push('Check database queries and external API calls');
    }

    // AI-powered prediction
    const aiPrediction = await this.predictWithAI(metrics);
    if (aiPrediction.anomaly) {
      predictions.push(aiPrediction.message);
    }

    return { status, predictions, recommendations, autoActions };
  }

  // AI-powered anomaly detection
  private async predictWithAI(metrics: SystemMetrics): Promise<{
    anomaly: boolean;
    message: string;
  }> {
    try {
      const prompt = `Analyze these system metrics and detect anomalies:
CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%, Disk: ${metrics.disk}%
Requests: ${metrics.requests}/min, Errors: ${metrics.errors}, Latency: ${metrics.latency}ms

Is there an anomaly? Respond with JSON: {"anomaly": boolean, "message": "explanation"}`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 200, temperature: 0.3 }
      });

      const result = JSON.parse(response.generated_text);
      return result;
    } catch {
      return { anomaly: false, message: '' };
    }
  }

  // ==========================================
  // 💻 CODE ANALYSIS & REVIEW
  // ==========================================

  // Analyze code quality
  async analyzeCode(code: string, language: string): Promise<CodeAnalysis> {
    try {
      const prompt = `Analyze this ${language} code for quality, issues, and security:

\`\`\`${language}
${code}
\`\`\`

Respond with JSON:
{
  "quality": 0-100,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1"],
  "security": ["security concern1"]
}`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 500, temperature: 0.2 }
      });

      return JSON.parse(response.generated_text);
    } catch {
      return { quality: 0, issues: [], suggestions: [], security: [] };
    }
  }

  // Generate code from description
  async generateCode(description: string, language: string): Promise<string> {
    try {
      const prompt = `Generate ${language} code for: ${description}
      
Requirements:
- Clean, readable code
- Include comments
- Follow best practices
- Handle errors properly

Return only the code, no explanations.`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 1000, temperature: 0.3 }
      });

      return response.generated_text;
    } catch (error) {
      throw new Error('Code generation failed');
    }
  }

  // Fix bugs automatically
  async fixBug(code: string, error: string, language: string): Promise<{
    fixedCode: string;
    explanation: string;
  }> {
    try {
      const prompt = `Fix this ${language} code that has the following error:

Error: ${error}

Code:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON:
{
  "fixedCode": "the corrected code",
  "explanation": "what was wrong and how it was fixed"
}`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 1000, temperature: 0.2 }
      });

      return JSON.parse(response.generated_text);
    } catch {
      return { fixedCode: code, explanation: 'Could not fix automatically' };
    }
  }

  // ==========================================
  // 📊 LOG ANALYSIS
  // ==========================================

  // Analyze logs and find patterns
  async analyzeLogs(logs: string[]): Promise<{
    summary: string;
    errors: string[];
    patterns: string[];
    rootCause: string;
    solution: string;
  }> {
    try {
      const logsText = logs.slice(0, 50).join('\n');
      
      const prompt = `Analyze these application logs and identify issues:

${logsText}

Respond with JSON:
{
  "summary": "brief summary",
  "errors": ["error1", "error2"],
  "patterns": ["pattern1"],
  "rootCause": "likely root cause",
  "solution": "recommended solution"
}`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 500, temperature: 0.3 }
      });

      return JSON.parse(response.generated_text);
    } catch {
      return {
        summary: 'Analysis failed',
        errors: [],
        patterns: [],
        rootCause: 'Unknown',
        solution: 'Manual investigation required'
      };
    }
  }

  // ==========================================
  // 🚀 DEPLOYMENT ASSISTANCE
  // ==========================================

  // Generate deployment plan
  async generateDeploymentPlan(changes: string[]): Promise<{
    steps: string[];
    risks: string[];
    rollbackPlan: string[];
    estimatedTime: string;
  }> {
    const prompt = `Create a deployment plan for these changes:
${changes.join('\n')}

Include steps, risks, rollback plan, and time estimate.
Respond with JSON.`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 500, temperature: 0.3 }
      });

      return JSON.parse(response.generated_text);
    } catch {
      return {
        steps: ['Review changes', 'Test in staging', 'Deploy to production'],
        risks: ['Service disruption'],
        rollbackPlan: ['Revert to previous version'],
        estimatedTime: '30 minutes'
      };
    }
  }

  // Generate Dockerfile
  async generateDockerfile(projectType: string, requirements: string[]): Promise<string> {
    const prompt = `Generate an optimized Dockerfile for a ${projectType} project with these requirements:
${requirements.join('\n')}

Include multi-stage build, security best practices, and health checks.`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 500, temperature: 0.3 }
      });

      return response.generated_text;
    } catch {
      return '# Dockerfile generation failed';
    }
  }

  // Generate Kubernetes manifests
  async generateK8sManifest(service: string, config: any): Promise<string> {
    const prompt = `Generate Kubernetes deployment manifest for service: ${service}
Config: ${JSON.stringify(config)}

Include deployment, service, and HPA.`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 800, temperature: 0.3 }
      });

      return response.generated_text;
    } catch {
      return '# K8s manifest generation failed';
    }
  }
}

export const devOpsAIService = new DevOpsAIService();
