// DevOps AI Routes - Mnbara AI
// مسارات الذكاء الاصطناعي للعمليات الفنية

import { Router } from 'express';
import { devOpsAIController } from '../controllers/devops-ai.controller';

const router = Router();

// ==========================================
// 🔧 SYSTEM MONITORING
// ==========================================

// POST /api/v1/devops/health - Analyze system health
router.post('/health', devOpsAIController.analyzeHealth.bind(devOpsAIController));

// ==========================================
// 💻 CODE ANALYSIS
// ==========================================

// POST /api/v1/devops/code/analyze - Analyze code quality
router.post('/code/analyze', devOpsAIController.analyzeCode.bind(devOpsAIController));

// POST /api/v1/devops/code/generate - Generate code from description
router.post('/code/generate', devOpsAIController.generateCode.bind(devOpsAIController));

// POST /api/v1/devops/code/fix - Fix bug in code
router.post('/code/fix', devOpsAIController.fixBug.bind(devOpsAIController));

// ==========================================
// 📊 LOG ANALYSIS
// ==========================================

// POST /api/v1/devops/logs/analyze - Analyze application logs
router.post('/logs/analyze', devOpsAIController.analyzeLogs.bind(devOpsAIController));

// ==========================================
// 🚀 DEPLOYMENT
// ==========================================

// POST /api/v1/devops/deploy/plan - Generate deployment plan
router.post('/deploy/plan', devOpsAIController.generateDeploymentPlan.bind(devOpsAIController));

// POST /api/v1/devops/deploy/dockerfile - Generate Dockerfile
router.post('/deploy/dockerfile', devOpsAIController.generateDockerfile.bind(devOpsAIController));

// POST /api/v1/devops/deploy/k8s - Generate Kubernetes manifest
router.post('/deploy/k8s', devOpsAIController.generateK8sManifest.bind(devOpsAIController));

export default router;
