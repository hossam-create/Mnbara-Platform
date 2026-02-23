import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureService } from '../feature/feature.service';

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureService: FeatureService,
  ) {}

  async create(data: any, createdBy: string) {
    return this.prisma.release.create({ data: { ...data, createdBy } });
  }

  async getByVersion(version: string) {
    const release = await this.prisma.release.findUnique({ where: { version } });
    if (!release) return null;

    const features = await this.prisma.feature.findMany({
      where: { key: { in: release.features } },
    });

    return { ...release, featureDetails: features };
  }

  async list(status?: string, limit: number = 20) {
    return this.prisma.release.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async update(version: string, data: any) {
    return this.prisma.release.update({ where: { version }, data });
  }

  async schedule(version: string, scheduledAt: string) {
    return this.prisma.release.update({
      where: { version },
      data: { status: 'SCHEDULED', scheduledAt: new Date(scheduledAt) },
    });
  }

  async deploy(version: string, adminId: string) {
    const release = await this.prisma.release.findUnique({ where: { version } });
    if (!release) return null;

    await this.prisma.release.update({ where: { version }, data: { status: 'IN_PROGRESS' } });

    const enabledFeatures: string[] = [];
    for (const featureKey of release.features) {
      try {
        const feature = await this.featureService.enableFeature(featureKey, adminId, `Release ${release.version}`);
        enabledFeatures.push(feature.key);
      } catch (err) {
        this.logger.error(`Failed to enable feature ${featureKey}:`, err);
      }
    }

    const updatedRelease = await this.prisma.release.update({
      where: { version },
      data: { status: 'RELEASED', releasedAt: new Date() },
    });

    return { release: updatedRelease, enabledFeatures };
  }

  async rollback(version: string, adminId: string, reason?: string) {
    const release = await this.prisma.release.findUnique({ where: { version } });
    if (!release) return null;

    const disabledFeatures: string[] = [];
    for (const featureKey of release.features) {
      try {
        await this.featureService.disableFeature(featureKey, adminId, `Rollback: ${reason}`);
        disabledFeatures.push(featureKey);
      } catch (err) {
        this.logger.error(`Failed to disable feature ${featureKey}:`, err);
      }
    }

    const updatedRelease = await this.prisma.release.update({
      where: { version },
      data: { status: 'ROLLED_BACK' },
    });

    return { release: updatedRelease, disabledFeatures };
  }

  async getChangelog() {
    const releases = await this.prisma.release.findMany({
      where: { status: 'RELEASED' },
      orderBy: { releasedAt: 'desc' },
      take: 10,
    });

    return releases.map((r) => ({
      version: r.version, name: r.name, nameAr: r.nameAr,
      releaseNotes: r.releaseNotes, releaseNotesAr: r.releaseNotesAr,
      releasedAt: r.releasedAt, features: r.features, breakingChanges: r.breakingChanges,
    }));
  }
}
