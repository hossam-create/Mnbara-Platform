export class CreateConsentDto {
  readonly documentSlug: string;
  readonly documentVersion: string;
  readonly ipAddress: string;
  readonly deviceFingerprint: string;
  readonly userAgent: string;
  readonly locale: string;
  readonly userId?: string;
}