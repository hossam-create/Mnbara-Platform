export class ConsentStatusDto {
  readonly accepted: boolean;
  readonly documentVersion: string;
  readonly acceptedAt?: Date;
  readonly requiresReconsent: boolean;
}