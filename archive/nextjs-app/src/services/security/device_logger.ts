type DeviceSecurityEvent = {
  userId: string;
  orderId: string;
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  activity: string;
  reasons: string[];
  recordedAt: string;
};

const MAX_LOGS = 200;
const deviceLogBuffer: DeviceSecurityEvent[] = [];

export function logDeviceSecurityEvent(event: Omit<DeviceSecurityEvent, 'recordedAt'>): DeviceSecurityEvent {
  const record: DeviceSecurityEvent = {
    ...event,
    recordedAt: new Date().toISOString(),
  };

  deviceLogBuffer.push(record);
  if (deviceLogBuffer.length > MAX_LOGS) {
    deviceLogBuffer.shift();
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[DEVICE_SECURITY_EVENT]', record);
  }

  return record;
}

export function listRecentDeviceEvents(limit = 20): DeviceSecurityEvent[] {
  return deviceLogBuffer.slice(Math.max(deviceLogBuffer.length - limit, 0)).reverse();
}
