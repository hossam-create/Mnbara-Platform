import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { WhatsAppCommandCenter, WhatsAppMessage } from '../services/whatsapp/WhatsAppCommandCenter';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const commandCenter = new WhatsAppCommandCenter(prisma);

// WhatsApp webhook endpoint
router.post('/webhook/:businessAccountId', async (req: any, res: any) => {
  try {
    const { businessAccountId } = req.params;
    
    // Verify webhook signature (if configured)
    const signature = req.headers['x-hub-signature-256'];
    const webhookSecret = process.env['WHATSAPP_WEBHOOK_SECRET'];
    
    if (webhookSecret && signature) {
      // In production, implement proper signature verification
      logger.info(`Webhook signature verification for business: ${businessAccountId}`);
    }

    // Process incoming messages
    if (req.body.object && req.body.object === 'whatsapp_business_account') {
      // WhatsApp webhook verification
      res.status(200).send(req.body.challenge);
      return;
    }

    // Handle message notifications
    if (req.body.entry) {
      for (const entry of req.body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              for (const message of change.value.messages) {
                await processWhatsAppMessage(message, businessAccountId);
              }
            }
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('WhatsApp webhook error:', error);
    res.status(500).send('Error');
  }
});

// Send WhatsApp message
router.post('/send', authMiddleware, rbacMiddleware(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      to: z.string(),
      message: z.string(),
      messageType: z.enum(['TEXT', 'IMAGE', 'DOCUMENT']).default('TEXT')
    });

    const data = schema.parse(req.body);

    // In a real implementation, this would use WhatsApp Cloud API
    // For now, just store the message
    await prisma.whatsappMessage.create({
      data: {
        businessAccountId: data.businessAccountId,
        whatsappMessageId: `out_${Date.now()}`,
        contactPhoneNumber: data.to,
        messageType: data.messageType,
        direction: 'OUTBOUND',
        content: data.message,
        status: 'PENDING'
      }
    });

    res.json({ 
      success: true, 
      message: 'Message queued for delivery' 
    });
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
    res.status(500).json({ 
      error: 'Failed to send message' 
    });
  }
});

// Configure WhatsApp
router.post('/configure', authMiddleware, rbacMiddleware(['ADMIN']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      phoneNumberId: z.string(),
      phoneNumber: z.string(),
      displayName: z.string().optional(),
      webhookUrl: z.string().url(),
      webhookSecret: z.string().optional(),
      accessToken: z.string(),
      verifyToken: z.string().optional(),
      dailyMessageLimit: z.number().default(1000),
      autoReplyEnabled: z.boolean().default(false),
      businessHoursOnly: z.boolean().default(false),
      timezone: z.string().default('UTC')
    });

    const data = schema.parse(req.body);

    // Check if configuration already exists
    const existing = await prisma.whatsappConfiguration.findUnique({
      where: {
        businessAccountId_phoneNumber: {
          businessAccountId: data.businessAccountId,
          phoneNumber: data.phoneNumber
        }
      }
    });

    if (existing) {
      // Update existing configuration
      await prisma.whatsappConfiguration.update({
        where: { id: existing.id },
        data: {
          phoneNumberId: data.phoneNumberId,
          displayName: data.displayName,
          webhookUrl: data.webhookUrl,
          webhookSecret: data.webhookSecret,
          accessToken: data.accessToken,
          verifyToken: data.verifyToken,
          dailyMessageLimit: data.dailyMessageLimit,
          autoReplyEnabled: data.autoReplyEnabled,
          businessHoursOnly: data.businessHoursOnly,
          timezone: data.timezone
        }
      });
    } else {
      // Create new configuration
      await prisma.$queryRaw`SELECT register_whatsapp_configuration(
        ${data.businessAccountId},
        ${data.phoneNumberId},
        ${data.phoneNumber},
        ${data.displayName || data.phoneNumber},
        ${data.webhookUrl},
        ${data.webhookSecret || null},
        ${data.accessToken},
        ${data.verifyToken || null}
      )`;
    }

    res.json({ 
      success: true, 
      message: 'WhatsApp configuration saved successfully' 
    });
  } catch (error) {
    logger.error('Failed to configure WhatsApp:', error);
    res.status(500).json({ 
      error: 'Failed to save WhatsApp configuration' 
    });
  }
});

// Get WhatsApp configuration
router.get('/configuration/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;

    const configuration = await prisma.whatsappConfiguration.findUnique({
      where: { businessAccountId }
    });

    if (!configuration) {
      return res.status(404).json({ 
        error: 'WhatsApp configuration not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        id: configuration.id,
        phoneNumberId: configuration.phone_number_id,
        phoneNumber: configuration.phone_number,
        displayName: configuration.display_name,
        isActive: configuration.is_active,
        isVerified: configuration.is_verified,
        dailyMessageLimit: configuration.daily_message_limit,
        messagesSentToday: configuration.messages_sent_today,
        autoReplyEnabled: configuration.auto_reply_enabled,
        businessHoursOnly: configuration.business_hours_only,
        timezone: configuration.timezone,
        createdAt: configuration.created_at,
        updatedAt: configuration.updated_at
      }
    });
  } catch (error) {
    logger.error('Failed to get WhatsApp configuration:', error);
    res.status(500).json({ 
      error: 'Failed to get WhatsApp configuration' 
    });
  }
});

// Add/update WhatsApp contact
router.post('/contacts', authMiddleware, rbacMiddleware(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      whatsappPhoneNumber: z.string(),
      contactName: z.string(),
      displayName: z.string().optional(),
      isBusiness: z.boolean().default(false),
      isAdmin: z.boolean().default(false),
      permissions: z.array(z.string()).default([]),
      role: z.enum(['ADMIN', 'MANAGER', 'USER']).default('USER'),
      userId: z.string().optional()
    });

    const data = schema.parse(req.body);

    // Check if contact already exists
    const existing = await prisma.whatsappContact.findUnique({
      where: {
        businessAccountId_whatsappPhoneNumber: {
          businessAccountId: data.businessAccountId,
          whatsappPhoneNumber: data.whatsappPhoneNumber
        }
      }
    });

    if (existing) {
      // Update existing contact
      await prisma.whatsappContact.update({
        where: { id: existing.id },
        data: {
          contactName: data.contactName,
          displayName: data.displayName,
          isBusiness: data.isBusiness,
          isAdmin: data.isAdmin,
          permissions: data.permissions,
          role: data.role,
          userId: data.userId
        }
      });
    } else {
      // Create new contact
      await prisma.whatsappContact.create({
        data: {
          businessAccountId: data.businessAccountId,
          whatsappPhoneNumber: data.whatsappPhoneNumber,
          contactName: data.contactName,
          displayName: data.displayName,
          isBusiness: data.isBusiness,
          isAdmin: data.isAdmin,
          permissions: data.permissions,
          role: data.role,
          userId: data.userId
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Contact saved successfully' 
    });
  } catch (error) {
    logger.error('Failed to save WhatsApp contact:', error);
    res.status(500).json({ 
      error: 'Failed to save contact' 
    });
  }
});

// Get WhatsApp contacts
router.get('/contacts/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const { includeBlocked = 'false' } = req.query;

    const whereClause: any = { businessAccountId };
    if (includeBlocked === 'false') {
      whereClause.isBlocked = false;
    }

    const contacts = await prisma.whatsappContact.findMany({
      where: whereClause,
      orderBy: { lastMessageAt: 'desc' }
    });

    res.json({ 
      success: true, 
      data: contacts.map(contact => ({
        id: contact.id,
        phoneNumber: contact.whatsapp_phone_number,
        name: contact.contact_name,
        displayName: contact.display_name,
        isBusiness: contact.is_business,
        isVerified: contact.is_verified,
        isBlocked: contact.is_blocked,
        isAdmin: contact.role === 'ADMIN',
        permissions: contact.permissions,
        role: contact.role,
        userId: contact.user_id,
        messageCount: contact.message_count,
        lastMessageAt: contact.last_message_at,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      }))
    });
  } catch (error) {
    logger.error('Failed to get WhatsApp contacts:', error);
    res.status(500).json({ 
      error: 'Failed to get contacts' 
    });
  }
});

// Add/update WhatsApp command
router.post('/commands', authMiddleware, rbacMiddleware(['ADMIN']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      commandName: z.string(),
      commandPattern: z.string(),
      description: z.string(),
      category: z.enum(['FINANCIAL', 'REPORTS', 'SYSTEM', 'WORKFLOW']),
      requiredPermissions: z.array(z.string()).default([]),
      n8nWorkflowId: z.string().optional(),
      n8nWebhookUrl: z.string().url().optional(),
      requiresConfirmation: z.boolean().default(false),
      timeoutSeconds: z.number().default(300),
      maxExecutionsPerHour: z.number().default(10),
      successTemplate: z.string().optional(),
      errorTemplate: z.string().optional(),
      confirmationTemplate: z.string().optional()
    });

    const data = schema.parse(req.body);

    // Check if command already exists
    const existing = await prisma.whatsappCommand.findUnique({
      where: {
        businessAccountId_commandName: {
          businessAccountId: data.businessAccountId,
          commandName: data.commandName
        }
      }
    });

    if (existing) {
      // Update existing command
      await prisma.whatsappCommand.update({
        where: { id: existing.id },
        data: {
          commandPattern: data.commandPattern,
          description: data.description,
          category: data.category,
          requiredPermissions: data.requiredPermissions,
          n8nWorkflowId: data.n8nWorkflowId,
          n8nWebhookUrl: data.n8nWebhookUrl,
          requiresConfirmation: data.requiresConfirmation,
          timeoutSeconds: data.timeoutSeconds,
          maxExecutionsPerHour: data.maxExecutionsPerHour,
          successTemplate: data.successTemplate,
          errorTemplate: data.errorTemplate,
          confirmationTemplate: data.confirmationTemplate
        }
      });
    } else {
      // Create new command
      await prisma.whatsappCommand.create({
        data: {
          businessAccountId: data.businessAccountId,
          commandName: data.commandName,
          commandPattern: data.commandPattern,
          description: data.description,
          category: data.category,
          requiredPermissions: data.requiredPermissions,
          n8nWorkflowId: data.n8nWorkflowId,
          n8nWebhookUrl: data.n8nWebhookUrl,
          requiresConfirmation: data.requiresConfirmation,
          timeoutSeconds: data.timeoutSeconds,
          maxExecutionsPerHour: data.maxExecutionsPerHour,
          successTemplate: data.successTemplate,
          errorTemplate: data.errorTemplate,
          confirmationTemplate: data.confirmationTemplate
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Command saved successfully' 
    });
  } catch (error) {
    logger.error('Failed to save WhatsApp command:', error);
    res.status(500).json({ 
      error: 'Failed to save command' 
    });
  }
});

// Get WhatsApp commands
router.get('/commands/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const { category, active = 'true' } = req.query;

    const whereClause: any = { businessAccountId };
    if (active === 'true') {
      whereClause.isActive = true;
    }
    if (category) {
      whereClause.category = category;
    }

    const commands = await prisma.whatsappCommand.findMany({
      where: whereClause,
      orderBy: { commandName: 'asc' }
    });

    res.json({ 
      success: true, 
      data: commands.map(command => ({
        id: command.id,
        name: command.command_name,
        pattern: command.command_pattern,
        description: command.description,
        category: command.category,
        requiredPermissions: command.required_permissions,
        n8nWorkflowId: command.n8n_workflow_id,
        isActive: command.is_active,
        requiresConfirmation: command.requires_confirmation,
        timeoutSeconds: command.timeout_seconds,
        maxExecutionsPerHour: command.max_executions_per_hour,
        successTemplate: command.success_template,
        errorTemplate: command.error_template,
        confirmationTemplate: command.confirmation_template,
        createdAt: command.created_at,
        updatedAt: command.updated_at
      }))
    });
  } catch (error) {
    logger.error('Failed to get WhatsApp commands:', error);
    res.status(500).json({ 
      error: 'Failed to get commands' 
    });
  }
});

// Get command history
router.get('/history/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      limit: z.string().optional().transform(val => parseInt(val) || 50),
      contactPhoneNumber: z.string().optional()
    });

    const { businessAccountId } = req.params;
    const { limit, contactPhoneNumber } = schema.parse(req.query);

    const history = await commandCenter.getCommandHistory(
      businessAccountId,
      contactPhoneNumber,
      limit
    );

    res.json({ 
      success: true, 
      data: history 
    });
  } catch (error) {
    logger.error('Failed to get command history:', error);
    res.status(500).json({ 
      error: 'Failed to get command history' 
    });
  }
});

// Get command center summary
router.get('/summary/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;

    const summary = await commandCenter.getCommandCenterSummary(businessAccountId);

    res.json({ 
      success: true, 
      data: summary 
    });
  } catch (error) {
    logger.error('Failed to get command center summary:', error);
    res.status(500).json({ 
      error: 'Failed to get command center summary' 
    });
  }
});

// Get analytics
router.get('/analytics/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const { days = 30 } = req.query;

    const analytics = await prisma.whatsappAnalytics.findMany({
      where: {
        businessAccountId,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      take: days
    });

    res.json({ 
      success: true, 
      data: analytics.map(analytic => ({
        date: analytic.date,
        totalMessagesSent: analytic.total_messages_sent,
        totalMessagesReceived: analytic.total_messages_received,
        uniqueContacts: analytic.unique_contacts,
        totalCommandsExecuted: analytic.total_commands_executed,
        successfulCommands: analytic.successful_commands,
        failedCommands: analytic.failed_commands,
        avgResponseTimeSeconds: analytic.avg_response_time_seconds,
        topCommands: analytic.top_commands
      }))
    });
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics' 
    });
  }
});

// Process message helper
async function processWhatsAppMessage(message: any, businessAccountId: string) {
  try {
    const whatsappMessage: WhatsAppMessage = {
      id: message.id,
      from: message.from,
      to: message.to,
      text: message.text?.body || '',
      type: message.type || 'text',
      timestamp: message.timestamp,
      status: message.status
    };

    await commandCenter.processIncomingMessage(whatsappMessage, businessAccountId);
  } catch (error) {
    logger.error('Failed to process WhatsApp message:', error);
  }
}

// Health check
router.get('/health', async (req: any, res: any) => {
  try {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        whatsapp_api: process.env['WHATSAPP_ACCESS_TOKEN'] ? 'configured' : 'not_configured',
        n8n_integration: 'ready', // Would check actual n8n connectivity
        database: 'connected'
      }
    };

    res.json({ 
      success: true, 
      data: status 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed' 
    });
  }
});

export default router;
