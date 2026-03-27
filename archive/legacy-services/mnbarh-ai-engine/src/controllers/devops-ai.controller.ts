// DevOps AI Controller - Mnbara AI
// متحكم الذكاء الاصطناعي للعمليات الفنية

import { Request, Response } from 'express';
import { devOpsAIService } from '../services/devops-ai.service';

export class DevOpsAIController {
  // ==========================================
  // 🔧 SYSTEM MONITORING
  // ==========================================

  // Analyze system health
  async analyzeHealth(req: Request, res: Response) {
    try {
      const { cpu, memory, disk, requests, errors, latency } = req.body;

      if (cpu === undefined || memory === undefined) {
        return res.status(400).json({
          success: false,
          message: 'CPU and memory metrics are required',
          messageAr: 'مقاييس المعالج والذاكرة مطلوبة'
        });
      }

      const analysis = await devOpsAIService.analyzeSystemHealth({
        cpu, memory, disk: disk || 0,
        requests: requests || 0, errors: errors || 0, latency: latency || 0
      });

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تحليل صحة النظام'
      });
    }
  }

  // ==========================================
  // 💻 CODE ANALYSIS
  // ==========================================

  // Analyze code quality
  async analyzeCode(req: Request, res: Response) {
    try {
      const { code, language } = req.body;

      if (!code || !language) {
        return res.status(400).json({
          success: false,
          message: 'Code and language are required',
          messageAr: 'الكود ولغة البرمجة مطلوبان'
        });
      }

      const analysis = await devOpsAIService.analyzeCode(code, language);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تحليل الكود'
      });
    }
  }

  // Generate code
  async generateCode(req: Request, res: Response) {
    try {
      const { description, language } = req.body;

      if (!description || !language) {
        return res.status(400).json({
          success: false,
          message: 'Description and language are required',
          messageAr: 'الوصف ولغة البرمجة مطلوبان'
        });
      }

      const code = await devOpsAIService.generateCode(description, language);

      res.json({
        success: true,
        data: { code, language }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء الكود'
      });
    }
  }

  // Fix bug
  async fixBug(req: Request, res: Response) {
    try {
      const { code, error, language } = req.body;

      if (!code || !error || !language) {
        return res.status(400).json({
          success: false,
          message: 'Code, error, and language are required',
          messageAr: 'الكود والخطأ ولغة البرمجة مطلوبين'
        });
      }

      const fix = await devOpsAIService.fixBug(code, error, language);

      res.json({
        success: true,
        data: fix
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إصلاح الخطأ'
      });
    }
  }

  // ==========================================
  // 📊 LOG ANALYSIS
  // ==========================================

  // Analyze logs
  async analyzeLogs(req: Request, res: Response) {
    try {
      const { logs } = req.body;

      if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({
          success: false,
          message: 'Logs array is required',
          messageAr: 'مصفوفة السجلات مطلوبة'
        });
      }

      const analysis = await devOpsAIService.analyzeLogs(logs);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تحليل السجلات'
      });
    }
  }

  // ==========================================
  // 🚀 DEPLOYMENT
  // ==========================================

  // Generate deployment plan
  async generateDeploymentPlan(req: Request, res: Response) {
    try {
      const { changes } = req.body;

      if (!changes || !Array.isArray(changes)) {
        return res.status(400).json({
          success: false,
          message: 'Changes array is required',
          messageAr: 'مصفوفة التغييرات مطلوبة'
        });
      }

      const plan = await devOpsAIService.generateDeploymentPlan(changes);

      res.json({
        success: true,
        data: plan
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء خطة النشر'
      });
    }
  }

  // Generate Dockerfile
  async generateDockerfile(req: Request, res: Response) {
    try {
      const { projectType, requirements } = req.body;

      if (!projectType) {
        return res.status(400).json({
          success: false,
          message: 'Project type is required',
          messageAr: 'نوع المشروع مطلوب'
        });
      }

      const dockerfile = await devOpsAIService.generateDockerfile(
        projectType,
        requirements || []
      );

      res.json({
        success: true,
        data: { dockerfile }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء Dockerfile'
      });
    }
  }

  // Generate K8s manifest
  async generateK8sManifest(req: Request, res: Response) {
    try {
      const { service, config } = req.body;

      if (!service) {
        return res.status(400).json({
          success: false,
          message: 'Service name is required',
          messageAr: 'اسم الخدمة مطلوب'
        });
      }

      const manifest = await devOpsAIService.generateK8sManifest(service, config || {});

      res.json({
        success: true,
        data: { manifest }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء K8s manifest'
      });
    }
  }
}

export const devOpsAIController = new DevOpsAIController();
