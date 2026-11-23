import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { VotingService } from './voting.service';
import { CreatePollDto, CastVoteDto } from './dto';

@Controller('voting')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  // ── PUBLIC VOTING ENDPOINTS (Mở trực tiếp từ liên kết Email / Zalo OA không cần đăng nhập) ──
  @Get('public-polls/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicPollById(@Param('id') id: string) {
    return this.votingService.getPollById('public_guest', id);
  }

  @Post('public-polls/:id/vote')
  @UseGuards(OptionalJwtAuthGuard)
  async castPublicVote(
    @Param('id') id: string,
    @Body() body: { optionId: string; voterName?: string; voterEmail?: string; voterPhone?: string; memberCode?: string },
  ) {
    return this.votingService.castPublicVote(id, body.optionId, body);
  }

  // ── CRM / APP PROTECTED VOTING ENDPOINTS ──
  @Get('polls')
  @UseGuards(JwtAuthGuard)
  async listPolls(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.votingService.listPolls(
      req.user.id || req.user.sub,
      associationId,
    );
  }

  @Get('polls/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPollById(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    return this.votingService.getPollById(userId, id);
  }

  @Post('polls')
  @UseGuards(JwtAuthGuard)
  async createPoll(@Request() req: any, @Body() body: CreatePollDto) {
    return this.votingService.createPoll(req.user.id || req.user.sub, body);
  }

  @Put('polls/:id')
  @UseGuards(JwtAuthGuard)
  async updatePoll(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.votingService.updatePoll(req.user.id || req.user.sub, id, body);
  }

  @Post('polls/:id/close')
  @UseGuards(JwtAuthGuard)
  async closePoll(@Request() req: any, @Param('id') id: string) {
    return this.votingService.closePoll(req.user.id || req.user.sub, id);
  }

  @Delete('polls/:id')
  @UseGuards(JwtAuthGuard)
  async deletePoll(@Request() req: any, @Param('id') id: string) {
    return this.votingService.deletePoll(req.user.id || req.user.sub, id);
  }

  @Post('polls/:id/vote')
  @UseGuards(OptionalJwtAuthGuard)
  async castVote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: CastVoteDto,
  ) {
    const userId = req.user?.id || req.user?.sub || 'guest_voter';
    return this.votingService.castVote(
      userId,
      id,
      body.optionId,
      body.sourceApp,
    );
  }

  @Post('polls/:id/broadcast')
  @UseGuards(OptionalJwtAuthGuard)
  async broadcastPoll(
    @Param('id') id: string,
    @Body() body: { emails?: string[]; eventId?: string; appUrl?: string },
  ) {
    return this.votingService.broadcastPollInvitation(id, body);
  }

  @Post('lucky-draw/notify')
  @UseGuards(OptionalJwtAuthGuard)
  async notifyLuckyDrawWinner(
    @Request() req: any,
    @Body()
    body: {
      winnerName: string;
      winnerCompany?: string;
      winnerCode?: string;
      luckyNumber?: string;
      prize?: string;
      prizeName?: string;
      eventName?: string;
      eventId?: string;
      winnerEmail?: string;
      email?: string;
      winnerPhone?: string;
    },
  ) {
    const userId = req.user?.id || req.user?.sub || 'system';
    return this.votingService.notifyLuckyDrawWinner(
      userId,
      body,
    );
  }
}
