import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text?: string;
  type: string;
  timestamp: string;
  status?: string;
}

export interface WhatsAppCommand {
  id: string;
  name: string;
  pattern: string;
  description: string;
  category: 'FINANCIAL' | 'REPORTS' | 'SYSTEM' | 'WORKFLOW';
  requiredPermissions: string[];
  n8nWorkflowId?: string;
  n8nWebhookUrl?: string;
  isActive: boolean;
  requiresConfirmation: boolean;
  timeoutSeconds: number;
  successTemplate?: string;
  errorTemplate?: string;
  confirmationTemplate?: string;
}

export interface WhatsAppContact {
  phoneNumber: string;
  name: string;
  displayName?: string;
  isBusiness: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  isAdmin: boolean;
  permissions: string[];
  role: 'ADMIN' | 'MANAGER' | 'USER';
  userId?: string;
}

export interface CommandExecution {
  id: string;
  commandId: string;
  contactPhoneNumber: string;
  executionStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  n8nExecutionId?: string;
  n8nWebhookResponse?: any;
  n8nStatusCode?: number;
  resultData?: any;
  errorMessage?: string;
}

export interface WhatsAppSession {
  id: string;
  contactPhoneNumber: string;
  sessionState: Record<string, any>;
  lastCommandAt?: Date;
  lastActivityAt: Date;
  isActive: boolean;
  contextVariables: Record<string, any>;
  pendingConfirmation?: any;
}

export interface ParsedCommand {
  commandName: string;
  category: string;
  parameters: Record<string, any>;
  rawMessage: string;
  confidence: number;
}

export class WhatsAppCommandCenter {
  constructor(private prisma: PrismaClient) {}

  async processIncomingMessage(message: WhatsAppMessage, businessAccountId: string): Promise<{
    status: string;
    executionId?: string;
    command?: ParsedCommand;
    response?: string;
  }> {
    try {
      logger.info(`Processing WhatsApp message from ${message.from} for business ${businessAccountId}`);

      // Store the incoming message
      await this.storeMessage(message, businessAccountId);

      // Parse command from message
      const parsedCommand = await this.parseCommand(message.text || '', businessAccountId);
      
      if (!parsedCommand) {
        return {
          status: 'NO_COMMAND_MATCHED',
          response: 'Command not recognized. Type "help" for available commands.'
        };
      }

      // Check if contact is blocked
      const contact = await this.getContact(message.from, businessAccountId);
      if (contact?.isBlocked) {
        return {
          status: 'CONTACT_BLOCKED',
          response: 'Your number is blocked from using this service.'
        };
      }

      // Check permissions
      const hasPermission = await this.checkPermissions(
        message.from,
        businessAccountId,
        parsedCommand.commandName
      );

      if (!hasPermission) {
        return {
          status: 'PERMISSION_DENIED',
          response: 'You don\'t have permission to execute this command.'
        };
      }

      // Get command details
      const command = await this.getCommand(parsedCommand.commandName, businessAccountId);
      if (!command || !command.isActive) {
        return {
          status: 'COMMAND_NOT_FOUND',
          response: 'Command not found or inactive.'
        };
      }

      // Create command execution record
      const execution = await this.createCommandExecution(
        command.id,
        message.from,
        parsedCommand
      );

      // Execute the command
      const result = await this.executeCommand(command, execution, parsedCommand);

      return {
        status: result.status,
        executionId: execution.id,
        command: parsedCommand,
        response: result.response
      };
    } catch (error) {
      logger.error('Failed to process WhatsApp message:', error);
      return {
        status: 'PROCESSING_ERROR',
        response: 'Failed to process your request. Please try again.'
      };
    }
  }

  async parseCommand(message: string, businessAccountId: string): Promise<ParsedCommand | null> {
    try {
      // Get active commands for the business
      const commands = await this.prisma.whatsappCommand.findMany({
        where: {
          businessAccountId,
          isActive: true
        },
        select: {
          commandName: true,
          commandPattern: true,
          category: true
        }
      });

      const normalizedMessage = message.toLowerCase().trim();

      // Try to match command patterns
      for (const command of commands) {
        const pattern = command.commandPattern;
        
        // Simple pattern matching (can be enhanced with regex)
        if (this.matchPattern(normalizedMessage, pattern)) {
          const parameters = this.extractParameters(normalizedMessage, command.commandName);
          
          return {
            commandName: command.commandName,
            category: command.category,
            parameters,
            rawMessage: message,
            confidence: 0.9
          };
        }
      }

      // Try Arabic commands
      const arabicCommands = {
        'balance': ['رصيد', 'حساب', 'توازن'],
        'report': ['تقرير', 'كشف', 'بيان'],
        'invoice': ['فاتورة', 'فواتير', 'Invoice'],
        'help': ['مساعدة', 'help', 'مساعدة'],
        'status': ['حالة', 'وضع', 'status']
      };

      for (const [commandName, arabicVariations] of Object.entries(arabicCommands)) {
        if (arabicVariations.some(variation => normalizedMessage.includes(variation))) {
          const command = commands.find(cmd => cmd.commandName === commandName);
          if (command) {
            const parameters = this.extractParameters(normalizedMessage, commandName);
            
            return {
              commandName,
              category: command.category,
              parameters,
              rawMessage: message,
              confidence: 0.85
            };
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to parse command:', error);
      return null;
    }
  }

  private matchPattern(message: string, pattern: string): boolean {
    try {
      // Simple pattern matching - can be enhanced with regex
      if (pattern.startsWith('^') && pattern.endsWith('$')) {
        const regexPattern = pattern.slice(1, -1);
        const regex = new RegExp(regexPattern, 'i');
        return regex.test(message);
      }
      
      // Contains matching
      return message.toLowerCase().includes(pattern.toLowerCase());
    } catch (error) {
      logger.error('Pattern matching error:', error);
      return false;
    }
  }

  private extractParameters(message: string, commandName: string): Record<string, any> {
    const parameters: Record<string, any> = {};
    const normalizedMessage = message.toLowerCase().trim();
    
    // Remove command name from message
    const commandVariations = [commandName.toLowerCase()];
    
    // Add Arabic variations
    const arabicMap: Record<string, string[]> = {
      'balance': ['رصيد', 'حساب', 'توازن'],
      'report': ['تقرير', 'كشف', 'بيان'],
      'invoice': ['فاتورة', 'فواتير'],
      'help': ['مساعدة', 'help'],
      'status': ['حالة', 'وضع']
    };

    if (arabicMap[commandName]) {
      commandVariations.push(...arabicMap[commandName]);
    }

    let remainingMessage = normalizedMessage;
    for (const variation of commandVariations) {
      if (remainingMessage.includes(variation)) {
        remainingMessage = remainingMessage.replace(variation, '').trim();
        break;
      }
    }

    // Extract common parameters
    if (remainingMessage) {
      // Amount extraction
      const amountMatch = remainingMessage.match(/(\d+(?:\.\d+)?)/);
      if (amountMatch) {
        parameters.amount = parseFloat(amountMatch[1]);
      }

      // Date extraction
      const dateMatch = remainingMessage.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        parameters.date = dateMatch[1];
      }

      // Email extraction
      const emailMatch = remainingMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        parameters.email = emailMatch[1];
      }

      // Invoice number extraction
      const invoiceMatch = remainingMessage.match(/(?:invoice|فاتورة)\s*#?(\d+)/i);
      if (invoiceMatch) {
        parameters.invoiceNumber = invoiceMatch[1];
      }
    }

    parameters.rawMessage = remainingMessage;
    return parameters;
  }

  async checkPermissions(
    contactPhoneNumber: string,
    businessAccountId: string,
    commandName: string
  ): Promise<boolean> {
    try {
      // Get contact permissions
      const contact = await this.prisma.whatsappContact.findUnique({
        where: {
          businessAccountId_contactPhoneNumber: {
            businessAccountId,
            whatsappPhoneNumber: contactPhoneNumber
          }
        },
        select: {
          permissions: true,
          role: true
        }
      });

      if (!contact) {
        // Unknown contact - allow basic commands only
        const basicCommands = ['help', 'status'];
        return basicCommands.includes(commandName);
      }

      // Admin users have all permissions
      if (contact.role === 'ADMIN') {
        return true;
      }

      // Get command requirements
      const command = await this.prisma.whatsappCommand.findUnique({
        where: {
          businessAccountId_commandName: {
            businessAccountId,
            commandName
          }
        },
        select: {
          requiredPermissions: true
        }
      });

      if (!command || !command.requiredPermissions) {
        return true; // No specific permissions required
      }

      // Check if contact has all required permissions
      const contactPerms = contact.permissions as string[] || [];
      const requiredPerms = command.requiredPermissions as string[] || [];

      return requiredPerms.every(perm => contactPerms.includes(perm));
    } catch (error) {
      logger.error('Permission check error:', error);
      return false;
    }
  }

  async getCommand(commandName: string, businessAccountId: string): Promise<WhatsAppCommand | null> {
    try {
      const command = await this.prisma.whatsappCommand.findUnique({
        where: {
          businessAccountId_commandName: {
            businessAccountId,
            commandName
          }
        }
      });

      if (!command) {
        return null;
      }

      return {
        id: command.id,
        name: command.commandName,
        pattern: command.commandPattern,
        description: command.description || '',
        category: command.category as any,
        requiredPermissions: (command.requiredPermissions as any) || [],
        n8nWorkflowId: command.n8nWorkflowId || undefined,
        n8nWebhookUrl: command.n8nWebhookUrl || undefined,
        isActive: command.isActive,
        requiresConfirmation: command.requiresConfirmation,
        timeoutSeconds: command.timeoutSeconds || 300,
        successTemplate: command.successTemplate || undefined,
        errorTemplate: command.errorTemplate || undefined,
        confirmationTemplate: command.confirmationTemplate || undefined
      };
    } catch (error) {
      logger.error('Failed to get command:', error);
      return null;
    }
  }

  async getContact(phoneNumber: string, businessAccountId: string): Promise<WhatsAppContact | null> {
    try {
      const contact = await this.prisma.whatsappContact.findUnique({
        where: {
          businessAccountId_whatsappPhoneNumber: {
            businessAccountId,
            whatsappPhoneNumber: phoneNumber
          }
        }
      });

      if (!contact) {
        return null;
      }

      return {
        phoneNumber: contact.whatsappPhoneNumber,
        name: contact.contactName || '',
        displayName: contact.displayName || undefined,
        isBusiness: contact.isBusiness || false,
        isVerified: contact.isVerified || false,
        isBlocked: contact.isBlocked || false,
        isAdmin: contact.role === 'ADMIN',
        permissions: (contact.permissions as any) || [],
        role: contact.role as any,
        userId: contact.userId || undefined
      };
    } catch (error) {
      logger.error('Failed to get contact:', error);
      return null;
    }
  }

  async storeMessage(message: WhatsAppMessage, businessAccountId: string): Promise<void> {
    try {
      await this.prisma.whatsappMessage.create({
        data: {
          businessAccountId,
          whatsappMessageId: message.id,
          contactPhoneNumber: message.from,
          messageType: message.type,
          direction: 'INBOUND',
          content: message.text,
          status: 'RECEIVED',
          timestamps: JSON.stringify({
            received: message.timestamp
          }),
          isCommand: false // Will be updated if command is detected
        }
      });
    } catch (error) {
      logger.error('Failed to store message:', error);
    }
  }

  async createCommandExecution(
    commandId: string,
    contactPhoneNumber: string,
    parsedCommand: ParsedCommand
  ): Promise<CommandExecution> {
    try {
      const execution = await this.prisma.whatsappCommandExecution.create({
        data: {
          commandId,
          contactPhoneNumber,
          executionStatus: 'PENDING',
          startedAt: new Date()
        }
      });

      // Update the message to mark it as a command
      await this.prisma.whatsappMessage.updateMany({
        where: {
          businessAccountId: execution.businessAccountId,
          contactPhoneNumber,
          content: { contains: parsedCommand.rawMessage }
        },
        data: {
          isCommand: true,
          commandType: parsedCommand.commandName,
          commandParameters: parsedCommand.parameters,
          processingStatus: 'PENDING'
        }
      });

      return {
        id: execution.id,
        commandId,
        contactPhoneNumber,
        executionStatus: 'PENDING',
        startedAt: execution.startedAt
      };
    } catch (error) {
      logger.error('Failed to create command execution:', error);
      throw error;
    }
  }

  async executeCommand(
    command: WhatsAppCommand,
    execution: CommandExecution,
    parsedCommand: ParsedCommand
  ): Promise<{
    status: string;
    response: string;
  }> {
    try {
      logger.info(`Executing command ${command.name} for ${execution.contactPhoneNumber}`);

      // Update execution status to RUNNING
      await this.prisma.whatsappCommandExecution.update({
        where: { id: execution.id },
        data: {
          executionStatus: 'RUNNING',
          startedAt: new Date()
        }
      });

      // Prepare command payload
      const payload = {
        commandId: command.id,
        executionId: execution.id,
        parameters: parsedCommand.parameters,
        contactPhone: execution.contactPhoneNumber,
        timestamp: new Date().toISOString(),
        source: 'whatsapp_command_center'
      };

      let response = '';
      let status = 'COMPLETED';

      try {
        // Trigger n8n workflow if configured
        if (command.n8nWorkflowId && command.n8nWebhookUrl) {
          const n8nResult = await this.triggerN8nWorkflow(
            command.n8nWorkflowId,
            command.n8nWebhookUrl,
            payload
          );

          // Update execution with n8n results
          await this.prisma.whatsappCommandExecution.update({
            where: { id: execution.id },
            data: {
              n8nExecutionId: command.n8nWorkflowId,
              n8nWebhookResponse: n8nResult,
              n8nStatusCode: 200,
              resultData: n8nResult
            }
          });

          // Generate response from template
          response = this.generateResponse(command, 'success', n8nResult);
        } else {
          // Built-in command handling
          const result = await this.handleBuiltinCommand(command, parsedCommand);
          response = result.response;
          status = result.status;

          // Update execution with results
          await this.prisma.whatsappCommandExecution.update({
            where: { id: execution.id },
            data: {
              executionStatus: status,
              completedAt: new Date(),
              durationSeconds: Math.floor((Date.now() - execution.startedAt!.getTime()) / 1000),
              resultData: result.data
            }
          });
        }

        // Send response via WhatsApp
        await this.sendWhatsAppMessage(execution.contactPhoneNumber, response);

        // Update message processing status
        await this.updateMessageProcessingStatus(execution.businessAccountId, execution.contactPhoneNumber, parsedCommand.rawMessage, 'COMPLETED');

      } catch (error) {
        logger.error(`Command execution failed: ${error}`);
        status = 'FAILED';
        response = this.generateResponse(command, 'error', { error: error.message });

        // Update execution with error
        await this.prisma.whatsappCommandExecution.update({
          where: { id: execution.id },
          data: {
            executionStatus: 'FAILED',
            completedAt: new Date(),
            errorMessage: error.message
          }
        });

        // Update message processing status
        await this.updateMessageProcessingStatus(execution.businessAccountId, execution.contactPhoneNumber, parsedCommand.rawMessage, 'FAILED');
      }

      return { status, response };
    } catch (error) {
      logger.error('Failed to execute command:', error);
      return {
        status: 'EXECUTION_ERROR',
        response: command.errorTemplate || 'Command execution failed. Please try again.'
      };
    }
  }

  private async handleBuiltinCommand(
    command: WhatsAppCommand,
    parsedCommand: ParsedCommand
  ): Promise<{
    status: string;
    response: string;
    data?: any;
  }> {
    switch (command.name) {
      case 'help':
        return {
          status: 'COMPLETED',
          response: this.generateHelpMessage(),
          data: { command: 'help' }
        };

      case 'balance':
        return {
          status: 'COMPLETED',
          response: 'Balance inquiry functionality not yet implemented. Please check back later.',
          data: { command: 'balance', parameters: parsedCommand.parameters }
        };

      case 'report':
        return {
          status: 'COMPLETED',
          response: 'Report generation functionality not yet implemented. Please check back later.',
          data: { command: 'report', parameters: parsedCommand.parameters }
        };

      case 'status':
        return {
          status: 'COMPLETED',
          response: 'All systems are operational. Response time: < 1s',
          data: { command: 'status', systemStatus: 'healthy' }
        };

      default:
        return {
          status: 'NOT_IMPLEMENTED',
          response: 'This command is not yet implemented.',
          data: { command: command.name }
        };
    }
  }

  private generateHelpMessage(): string {
    return `📋 *Available Commands*

💰 *Financial Commands:*
• balance - Check account balance
• report - Generate financial report
• invoice - Create/send invoice

🔧 *System Commands:*
• help - Show this help message
• status - Check system status

📝 *Usage:*
Type the command name followed by any required parameters.
Example: "balance" or "report 2024-01"

🌐 *Language Support:*
Commands work in both English and Arabic.

Need help? Contact support.`;
  }

  private generateResponse(
    command: WhatsAppCommand,
    type: 'success' | 'error' | 'confirmation',
    data?: any
  ): string {
    let template = '';

    switch (type) {
      case 'success':
        template = command.successTemplate || 'Command completed successfully.';
        break;
      case 'error':
        template = command.errorTemplate || 'Command execution failed.';
        break;
      case 'confirmation':
        template = command.confirmationTemplate || 'Please confirm this action.';
        break;
    }

    // Simple template variable replacement
    if (data) {
      Object.keys(data).forEach(key => {
        const placeholder = `{{${key}}}`;
        template = template.replace(new RegExp(placeholder, 'g'), String(data[key]));
      });
    }

    return template;
  }

  private async triggerN8nWorkflow(
    workflowId: string,
    webhookUrl: string,
    payload: any
  ): Promise<any> {
    try {
      // In a real implementation, this would make an HTTP request to n8n
      // For now, return a mock response
      logger.info(`Triggering n8n workflow ${workflowId} with payload:`, payload);

      // Mock n8n response
      return {
        success: true,
        workflowId,
        executionId: `exec_${Date.now()}`,
        result: {
          status: 'completed',
          message: 'Workflow executed successfully',
          data: payload
        }
      };
    } catch (error) {
      logger.error('Failed to trigger n8n workflow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async sendWhatsAppMessage(to: string, message: string): Promise<void> {
    try {
      // In a real implementation, this would use the WhatsApp Cloud API
      // For now, just log the message
      logger.info(`Sending WhatsApp message to ${to}: ${message}`);

      // Store outbound message
      await this.prisma.whatsappMessage.create({
        data: {
          businessAccountId: '', // Would need to get this from context
          whatsappMessageId: `msg_${Date.now()}`,
          contactPhoneNumber: to,
          messageType: 'TEXT',
          direction: 'OUTBOUND',
          content: message,
          status: 'SENT'
        }
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error);
    }
  }

  private async updateMessageProcessingStatus(
    businessAccountId: string,
    contactPhoneNumber: string,
    content: string,
    status: string
  ): Promise<void> {
    try {
      await this.prisma.whatsappMessage.updateMany({
        where: {
          businessAccountId,
          contactPhoneNumber,
          content,
          direction: 'INBOUND'
        },
        data: {
          processingStatus: status
        }
      });
    } catch (error) {
      logger.error('Failed to update message processing status:', error);
    }
  }

  async updateAnalytics(businessAccountId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`SELECT update_whatsapp_analytics(${businessAccountId})`;
    } catch (error) {
      logger.error('Failed to update analytics:', error);
    }
  }

  async getCommandHistory(
    businessAccountId: string,
    contactPhoneNumber?: string,
    limit: number = 50
  ): Promise<CommandExecution[]> {
    try {
      const executions = await this.prisma.whatsappCommandExecution.findMany({
        where: {
          businessAccountId,
          ...(contactPhoneNumber && { contactPhoneNumber })
        },
        include: {
          command: {
            select: {
              commandName: true,
              category: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return executions.map(exec => ({
        id: exec.id,
        commandId: exec.commandId,
        contactPhoneNumber: exec.contactPhoneNumber,
        executionStatus: exec.executionStatus as any,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        durationSeconds: exec.durationSeconds || undefined,
        n8nExecutionId: exec.n8nExecutionId || undefined,
        n8nWebhookResponse: exec.n8nWebhookResponse,
        n8nStatusCode: exec.n8nStatusCode || undefined,
        resultData: exec.resultData,
        errorMessage: exec.errorMessage || undefined
      }));
    } catch (error) {
      logger.error('Failed to get command history:', error);
      return [];
    }
  }

  async getActiveContacts(businessAccountId: string): Promise<WhatsAppContact[]> {
    try {
      const contacts = await this.prisma.whatsappContact.findMany({
        where: {
          businessAccountId,
          isBlocked: false
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return contacts.map(contact => ({
        phoneNumber: contact.whatsappPhoneNumber,
        name: contact.contactName,
        displayName: contact.displayName || undefined,
        isBusiness: contact.isBusiness || false,
        isVerified: contact.isVerified || false,
        isBlocked: contact.isBlocked || false,
        isAdmin: contact.role === 'ADMIN',
        permissions: (contact.permissions as any) || [],
        role: contact.role as any,
        userId: contact.userId || undefined
      }));
    } catch (error) {
      logger.error('Failed to get active contacts:', error);
      return [];
    }
  }

  async getCommandCenterSummary(businessAccountId: string): Promise<any> {
    try {
      const summary = await this.prisma.$queryRaw`
        SELECT * FROM mv_whatsapp_command_center_summary 
        WHERE business_account_id = ${businessAccountId}
      `;

      return summary[0] || {};
    } catch (error) {
      logger.error('Failed to get command center summary:', error);
      return {};
    }
  }
}
