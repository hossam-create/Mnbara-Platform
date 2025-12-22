import api from './api';

export interface OpsMetrics {
  activeTravelers: number;
  activeTravelersChange: number;
  pendingShipments: number;
  pendingShipmentsChange: number;
  escrowTotal: number;
  escrowChange: number;
  securityThreats: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface GlobalOperationEvent {
  id: string;
  type: 'FLIGHT' | 'SHIPMENT' | 'ALERT';
  lat: number;
  lon: number;
  status: string;
}

class OpsService {
  // Get main dashboard metrics
  async getMetrics(): Promise<OpsMetrics> {
    // In production, this calls the /admin/ops/metrics endpoint
    // For now, if the endpoint doesn't exist, we can fallback to smart calculation or mock
    try {
      const response = await api.get('/admin/ops/metrics');
      return response.data.data;
    } catch (e) {
      // Fallback for Phase 22 "Air Bridge" testing before full backend deploy
      console.warn('OpsService: Using fallback data until backend is fully live');
      return {
        activeTravelers: 1240,
        activeTravelersChange: 12,
        pendingShipments: 8430,
        pendingShipmentsChange: 5,
        escrowTotal: 8200000,
        escrowChange: 1.8,
        securityThreats: 0,
        threatLevel: 'LOW'
      };
    }
  }

  // Get live map data
  async getMapData(): Promise<GlobalOperationEvent[]> {
    try {
      const response = await api.get('/admin/ops/map');
      return response.data.data;
    } catch (e) {
      return [];
    }
  }

  // Get department access logs
  async getAccessLogs() {
    return api.get('/admin/access-logs');
  }
}

export const opsService = new OpsService();
export default opsService;
