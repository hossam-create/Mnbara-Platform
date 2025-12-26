// Training Controller - Fine-tuning & Training Jobs
// متحكم التدريب - الضبط الدقيق ووظائف التدريب

import { Request, Response } from 'express';
import { modelService } from '../services/model.service';

export class TrainingController {
  // Create fine-tuning job
  async createJob(req: Request, res: Response) {
    try {
      const { 
        modelId, 
        datasetName, 
        datasetSize, 
        type, 
        epochs, 
        batchSize, 
        learningRate,
        loraRank 
      } = req.body;

      if (!modelId || !datasetName || !datasetSize) {
        return res.status(400).json({
          success: false,
          message: 'Model ID, dataset name, and dataset size are required',
          messageAr: 'معرف النموذج واسم مجموعة البيانات وحجمها مطلوبة'
        });
      }

      const job = await modelService.createFineTuningJob({
        modelId,
        datasetName,
        datasetSize,
        type,
        epochs,
        batchSize,
        learningRate,
        loraRank
      });

      res.status(201).json({
        success: true,
        message: 'Training job created',
        messageAr: 'تم إنشاء وظيفة التدريب',
        data: job
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get job status
  async getJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await modelService.getTrainingJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
          messageAr: 'الوظيفة غير موجودة'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // List jobs
  async listJobs(req: Request, res: Response) {
    try {
      const { modelId } = req.query;
      const jobs = await modelService.listTrainingJobs(modelId as string);

      res.json({
        success: true,
        data: jobs
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const trainingController = new TrainingController();
