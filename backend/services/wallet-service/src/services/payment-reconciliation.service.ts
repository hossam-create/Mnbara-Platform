import { getPaymentGateway } from '../adapters/payment-gateway.registry';
import { paymentEventService } from './payment-event.service';
import { paymentProcessingService } from './payment-processing.service';
import { PaymentStatus } from '../interfaces/payment-gateway.interface';

export const paymentReconciliationService = {
  /**
   * Reconcile a specific payment by checking its status at the gateway.
   * If success at gateway but missing/unprocessed locally, triggers processing.
   * 
   * @param gatewayName - e.g. 'stripe', 'paymob'
   * @param referenceId - Gateway's object ID (e.g. pi_123)
   */
  async reconcilePayment(gatewayName: string, referenceId: string) {
    console.log(`[Reconciliation] Checking ${gatewayName}:${referenceId}`);
    
    // 1. Check Local State
    // If we have an event AND it is processed, we are good.
    const existing = await paymentEventService.findEvent(gatewayName, referenceId);
    if (existing?.processed) {
      console.log(`[Reconciliation] ${referenceId} already processed.`);
      return { status: 'already_reconciled', eventId: existing.id, reconciled: true };
    }

    // 2. Poll Gateway to find ground truth
    try {
      const adapter = getPaymentGateway(gatewayName);
      const details = await adapter.getPaymentDetails(referenceId);

      // 3. Compare & Act
      // If Gateway says COMPLETED, we must enforce it locally.
      if (details.status === PaymentStatus.COMPLETED) {
        console.log(`[Reconciliation] Gateway confirmed success. Triggering internal processing.`);
        
        // This is the CRITICAL recovery step (Use trusted internal method)
        const result = await paymentProcessingService.processReconciledPayment(gatewayName, details);
        
        return { status: 'reconciled_success', result, reconciled: true };
      } else {
        console.log(`[Reconciliation] Gateway status is ${details.status}. No action taken.`);
        // If it was PENDING locally, we might want to fail it? 
        // For now, we only recover Success.
        return { status: 'gateway_not_success', gatewayStatus: details.status, reconciled: false };
      }

    } catch (error: any) {
       console.error(`[Reconciliation] Failed to fetch details from gateway:`, error.message);
       // Could be invalid ID or network error
       return { status: 'error', error: error.message, reconciled: false };
    }
  }
};
