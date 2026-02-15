// GeoLock Service Types
// أنواع خدمة GeoLock

// ==========================================
// 📍 Location Types
// ==========================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface IPLocation {
  ip: string;
  ipVersion: number;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  cityCode: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isInEU: boolean | null;
  isp: string | null;
  organization: string | null;
  asn: string | null;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationFusion {
  ipLocation: IPLocation | null;
  gpsLocation: GPSLocation | null;
  fusedLocation: Coordinates | null;
  confidence: number;
  isTrusted: boolean;
  mismatchDetected: boolean;
  mismatchDistance: number | null;
  riskScore: number;
}

// ==========================================
// 🌍 GeoLock Types
// ==========================================

export interface GeoLockCheckRequest {
  targetType: 'user' | 'session' | 'ip' | 'request';
  targetId: string;
  ipAddress?: string;
  gpsLocation?: GPSLocation;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  userRoles?: string[];
}

export interface GeoLockCheckResult {
  allowed: boolean;
  lockId?: string;
  lockName?: string;
  reason?: string;
  reasonAr?: string;
  blockAction?: string;
  redirectUrl?: string;
  message?: string;
  messageAr?: string;
  riskScore: number;
  bypassAvailable: boolean;
  bypassExpiresAt?: Date;
  detectedLocation?: IPLocation;
}

export interface GeoLockRule {
  id: string;
  name: string;
  lockType: string;
  countries: string[];
  regions: string[];
  cities: string[];
  blockVPNs: boolean;
  blockProxies: boolean;
  blockTor: boolean;
  blockDataCenters: boolean;
  requireMFA: boolean;
  priority: number;
  isActive: boolean;
}

// ==========================================
// 🏢 Geofence Types
// ==========================================

export interface GeofenceZoneData {
  id: string;
  name: string;
  code: string;
  zoneType: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  polygonCoords?: Coordinates[];
  airportCode?: string;
  airportName?: string;
  isActive: boolean;
  triggerOnEntry: boolean;
  triggerOnExit: boolean;
  alertTypes: string[];
}

export interface GeofenceCheckResult {
  insideZones: GeofenceZoneData[];
  exitedZones: GeofenceZoneData[];
  enteredZones: GeofenceZoneData[];
  nearbyZones: GeofenceZoneData[];
  currentZone?: GeofenceZoneData;
  distanceToZone: Map<string, number>;
}

export interface GeofenceEventData {
  zoneId: string;
  zoneName: string;
  eventType: 'ENTER' | 'EXIT' | 'PROXIMITY' | 'SPEED' | 'DWELL' | 'TRAVEL_DETECTED';
  userId: string;
  latitude: number;
  longitude: number;
  distanceFromCenter?: number;
  speed?: number;
  heading?: number;
  previousZoneId?: string;
  nextZoneId?: string;
  durationInZone?: number;
  travelTime?: number;
  travelDistance?: number;
}

// ==========================================
// ✈️ Alert Types
// ==========================================

export interface LocationAlertData {
  id: string;
  name: string;
  alertType: string;
  triggerType: string;
  triggerValue: number;
  targetLatitude: number;
  targetLongitude: number;
  targetName?: string;
  targetCode?: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  actions?: AlertAction[];
  isActive: boolean;
  maxAlertsPerUser: number;
  cooldownMinutes: number;
}

export interface AlertAction {
  type: 'offer' | 'notification' | 'redirect' | 'custom';
  data: Record<string, any>;
}

export interface AlertTriggerResult {
  alertId: string;
  triggered: boolean;
  userIds: string[];
  notifications: AlertNotificationData[];
  reason?: string;
}

export interface AlertNotificationData {
  alertId: string;
  userId: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  latitude: number;
  longitude: number;
  actions?: AlertAction[];
  expiresAt?: Date;
}

// ==========================================
// 🛡️ Bypass Types
// ==========================================

export interface BypassRequestData {
  userId: string;
  userEmail?: string;
  userRole?: string;
  lockId?: string;
  lockType?: string;
  reason: string;
  reasonAr?: string;
  duration?: number;
  evidence?: Record<string, any>;
}

export interface BypassApprovalData {
  requestId: string;
  approved: boolean;
  reviewerId: string;
  reviewerNotes?: string;
  duration?: number;
  approverIp?: string;
}

// ==========================================
// 📊 API Response Types
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorAr?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// 🔧 Utility Types
// ==========================================

export interface DistanceResult {
  distance: number; // kilometers
  duration?: number; // minutes
}

export interface PolygonBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface TimeRestriction {
  start: string; // HH:mm
  end: string;   // HH:mm
  timezone: string;
}

export interface DayRestriction {
  daysOfWeek: number[]; // 0-6
  timeRestriction?: TimeRestriction;
}
