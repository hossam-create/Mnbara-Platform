import { Router } from 'express';
import { DisputeSystemController } from '../controllers/DisputeSystemController';

const router = Router();
const disputeSystemController = new DisputeSystemController();

// Dispute Ticket Management
router.post('/tickets', disputeSystemController.createDisputeTicket);
router.get('/tickets', disputeSystemController.getDisputeTickets);
router.get('/tickets/:ticketId', disputeSystemController.getDisputeTicket);
router.put('/tickets/:ticketId/status', disputeSystemController.updateTicketStatus);

// Message Management
router.post('/tickets/:ticketId/messages', disputeSystemController.addDisputeMessage);
router.get('/tickets/:ticketId/messages', disputeSystemController.getDisputeMessages);

// Evidence Management
router.post('/tickets/:ticketId/evidence', disputeSystemController.addEvidence);
router.get('/tickets/:ticketId/evidence', disputeSystemController.getDisputeEvidence);

// Configuration
router.get('/categories', disputeSystemController.getDisputeCategories);
router.get('/sla-rules', disputeSystemController.getSLARules);

// Analytics and Reporting
router.get('/analytics', disputeSystemController.getDisputeAnalytics);
router.get('/agent-performance', disputeSystemController.getAgentPerformance);
router.get('/dashboard', disputeSystemController.getDisputeDashboard);

// SLA Management
router.post('/trigger-sla-check', disputeSystemController.triggerSLACompliance);

export default router;
