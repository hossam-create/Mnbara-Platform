import { http, HttpResponse } from 'msw';
import {
  mockExchangeRequest,
  mockExchangeRequests,
  mockExchangeMatch,
  mockExchangeMatches,
  mockProofOfPayment,
  mockProofsOfPayment,
  mockSecurityDeposit,
  mockSecurityDeposits,
  mockTrustLevel,
  mockMessages,
  mockExternalEscrowProviders,
} from '../fixtures/mock-data';

const API_BASE_URL = 'http://localhost:3001/api';

export const handlers = [
  // ============================================================
  // EXCHANGE REQUEST ENDPOINTS
  // ============================================================

  http.post(`${API_BASE_URL}/exchange-requests`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeRequest,
    });
  }),

  http.get(`${API_BASE_URL}/exchange-requests`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeRequests,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/exchange-requests/:id`, ({ params }) => {
    const request = mockExchangeRequests.find(r => r.id === Number(params.id));
    if (!request) {
      return HttpResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: request,
    });
  }),

  http.patch(`${API_BASE_URL}/exchange-requests/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeRequest,
    });
  }),

  // ============================================================
  // MARKETPLACE ENDPOINTS
  // ============================================================

  http.get(`${API_BASE_URL}/marketplace`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeRequests,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    });
  }),

  // ============================================================
  // MATCH ENDPOINTS
  // ============================================================

  http.post(`${API_BASE_URL}/matches`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeMatch,
    });
  }),

  http.get(`${API_BASE_URL}/matches`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeMatches,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/matches/:id`, ({ params }) => {
    const match = mockExchangeMatches.find(m => m.id === Number(params.id));
    if (!match) {
      return HttpResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: match,
    });
  }),

  http.post(`${API_BASE_URL}/matches/:id/accept`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExchangeMatch,
    });
  }),

  // ============================================================
  // PROOF OF PAYMENT ENDPOINTS
  // ============================================================

  http.post(`${API_BASE_URL}/proofs`, () => {
    return HttpResponse.json({
      success: true,
      data: mockProofOfPayment,
    });
  }),

  http.get(`${API_BASE_URL}/proofs`, () => {
    return HttpResponse.json({
      success: true,
      data: mockProofsOfPayment,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/proofs/:id`, ({ params }) => {
    const proof = mockProofsOfPayment.find(p => p.id === Number(params.id));
    if (!proof) {
      return HttpResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: proof,
    });
  }),

  // ============================================================
  // SECURITY DEPOSIT ENDPOINTS
  // ============================================================

  http.get(`${API_BASE_URL}/deposits`, () => {
    return HttpResponse.json({
      success: true,
      data: mockSecurityDeposits,
    });
  }),

  http.post(`${API_BASE_URL}/deposits`, () => {
    return HttpResponse.json({
      success: true,
      data: mockSecurityDeposit,
    });
  }),

  // ============================================================
  // TRUST LEVEL ENDPOINTS
  // ============================================================

  http.get(`${API_BASE_URL}/trust-levels`, () => {
    return HttpResponse.json({
      success: true,
      data: mockTrustLevel,
    });
  }),

  // ============================================================
  // COMMUNICATION ENDPOINTS
  // ============================================================

  http.get(`${API_BASE_URL}/matches/:matchId/messages`, () => {
    return HttpResponse.json({
      success: true,
      data: mockMessages,
    });
  }),

  http.post(`${API_BASE_URL}/matches/:matchId/messages`, () => {
    return HttpResponse.json({
      success: true,
      data: mockMessages[0],
    });
  }),

  // ============================================================
  // EXTERNAL ESCROW ENDPOINTS
  // ============================================================

  http.get(`${API_BASE_URL}/external-escrow-providers`, () => {
    return HttpResponse.json({
      success: true,
      data: mockExternalEscrowProviders,
    });
  }),

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  http.get(`${API_BASE_URL}/admin/proofs/pending`, () => {
    return HttpResponse.json({
      success: true,
      data: mockProofsOfPayment,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  }),

  http.post(`${API_BASE_URL}/admin/proofs/:id/verify`, () => {
    return HttpResponse.json({
      success: true,
      data: mockProofOfPayment,
    });
  }),

  http.get(`${API_BASE_URL}/admin/dashboard`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalMatches: 150,
        completedMatches: 120,
        pendingMatches: 20,
        disputedMatches: 10,
        totalVolume: '500000',
        averageMatchScore: 0.92,
      },
    });
  }),
];
