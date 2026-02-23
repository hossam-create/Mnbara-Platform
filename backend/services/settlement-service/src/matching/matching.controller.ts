import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingEngineService } from './matching-engine.service';
import { MatchStatus } from '@prisma/client';

@ApiTags('Matching')
@Controller('api/matching')
export class MatchingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingEngine: MatchingEngineService,
  ) {}

  @Get('proposals/:transferId')
  @ApiOperation({ summary: 'Get match proposals for a transfer' })
  async getMatchProposals(@Param('transferId') transferId: string) {
    const matches = await this.prisma.settlementMatch.findMany({
      where: { requestId: transferId, status: MatchStatus.PROPOSED },
      include: { counterRequest: true },
      orderBy: { matchScore: 'desc' },
    });
    return { success: true, data: matches };
  }

  @Post(':matchId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a match' })
  async acceptMatch(@Param('matchId') matchId: string, @Body() body: { userId: string; isRequester: boolean }) {
    const match = await this.prisma.settlementMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const updateData = body.isRequester
      ? { requestAccepted: true }
      : { counterAccepted: true };

    const updated = await this.prisma.settlementMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    if (updated.requestAccepted && updated.counterAccepted) {
      await this.prisma.settlementMatch.update({
        where: { id: matchId },
        data: { status: MatchStatus.ACCEPTED, acceptedAt: new Date() },
      });
      await this.matchingEngine.executeMatch(matchId);
    }

    return { success: true, data: updated };
  }

  @Post(':matchId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a match' })
  async rejectMatch(@Param('matchId') matchId: string) {
    const match = await this.prisma.settlementMatch.update({
      where: { id: matchId },
      data: { status: MatchStatus.REJECTED },
    });
    return { success: true, data: match };
  }

  @Get(':matchId/status')
  @ApiOperation({ summary: 'Get match status' })
  async getMatchStatus(@Param('matchId') matchId: string) {
    const match = await this.prisma.settlementMatch.findUnique({
      where: { id: matchId },
      include: { request: true, counterRequest: true },
    });
    return { success: true, data: match };
  }

  @Post(':matchId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm settlement completion' })
  async confirmSettlement(@Param('matchId') matchId: string) {
    const result = await this.matchingEngine.completeSettlement(matchId);
    return { success: true, data: result, message: 'تمت التسوية بنجاح' };
  }
}
