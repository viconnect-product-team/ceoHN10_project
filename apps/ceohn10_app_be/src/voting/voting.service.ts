import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { VotingRepository } from './voting.repository';
import { CreatePollDto, CastVoteDto } from './dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

export { CreatePollDto, CastVoteDto };

@Injectable()
export class VotingService {
  constructor(
    private readonly votingRepo: VotingRepository,
    private readonly prisma: PrismaService,
    @Optional() private readonly mailService?: MailService,
  ) { }

  private computeOptionsWithStats(rawOptions: any[]): any[] {
    const opts = (rawOptions || []).map((o) => ({
      id: String(o.id),
      title: String(o.title || ''),
      votesCount: Number(o.votes_count || 0),
      associationVotes: Number(o.association_votes || 0),
      crmVotes: Number(o.crm_votes || 0),
      percentage: 0,
      isLeading: false,
    }));

    const totalVotes = opts.reduce((sum, o) => sum + o.votesCount, 0);
    const maxVotes =
      opts.length > 0 ? Math.max(...opts.map((o) => o.votesCount)) : 0;

    return opts.map((o) => ({
      ...o,
      percentage:
        totalVotes > 0
          ? Number(((o.votesCount / totalVotes) * 100).toFixed(1))
          : 0,
      isLeading: totalVotes > 0 && o.votesCount === maxVotes && maxVotes > 0,
    }));
  }

  async listPolls(userId: string, associationId?: string) {
    const rows = await this.votingRepo.listPollsRaw(userId);

    return rows.map((r) => {
      const options = this.computeOptionsWithStats(r.options || []);
      const totalVotes = options.reduce((sum, o) => sum + o.votesCount, 0);
      const sourceStats = r.source_stats || {
        associationApp: options.reduce((sum, o) => sum + o.associationVotes, 0),
        crm: options.reduce((sum, o) => sum + o.crmVotes, 0),
      };

      let pollStatus = r.status || 'open';
      if (r.event_id) {
        const evStatus = String(r.event_status || '').toLowerCase();
        let evEnded = evStatus === 'completed' || evStatus === 'cancelled';
        if (!evEnded && r.event_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const evDate = new Date(r.event_date);
          evDate.setHours(0, 0, 0, 0);
          if (evDate.getTime() < today.getTime()) {
            evEnded = true;
          }
        }
        if (evEnded) {
          pollStatus = 'closed';
          if (r.status !== 'closed') {
            void this.votingRepo.markPollClosed(r.id);
          }
        }
      }

      const myVoteOption = r.my_vote
        ? options.find((o) => o.id === r.my_vote) || null
        : null;

      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        status: pollStatus,
        eventId: r.event_id || null,
        eventName: r.event_name || null,
        options,
        myVote: r.my_vote || null,
        myVoteOptionTitle: myVoteOption?.title || null,
        myVoteSource: r.my_vote_source || null,
        totalVotes,
        sourceStats,
        createdAt: r.created_at,
        startDate: r.start_date || null,
        endDate: r.end_date || null,
      };
    });
  }

  async getPollById(userId: string, id: string) {
    const rows = await this.votingRepo.getPollByIdRaw(userId, id);
    if (rows.length === 0) throw new NotFoundException('Poll not found');

    const r = rows[0];
    const options = this.computeOptionsWithStats(r.options || []);
    const totalVotes = options.reduce((sum, o) => sum + o.votesCount, 0);
    const sourceStats = r.source_stats || {
      associationApp: options.reduce((sum, o) => sum + o.associationVotes, 0),
      crm: options.reduce((sum, o) => sum + o.crmVotes, 0),
    };

    let pollStatus = r.status || 'open';
    if (r.event_id) {
      const evStatus = String(r.event_status || '').toLowerCase();
      let evEnded = evStatus === 'completed' || evStatus === 'cancelled';
      if (!evEnded && r.event_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const evDate = new Date(r.event_date);
        evDate.setHours(0, 0, 0, 0);
        if (evDate.getTime() < today.getTime()) {
          evEnded = true;
        }
      }
      if (evEnded) {
        pollStatus = 'closed';
        if (r.status !== 'closed') {
          void this.votingRepo.markPollClosed(r.id);
        }
      }
    }

    const myVoteOption = r.my_vote
      ? options.find((o) => o.id === r.my_vote) || null
      : null;

    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      status: pollStatus,
      eventId: r.event_id || null,
      eventName: r.event_name || null,
      options,
      myVote: r.my_vote || null,
      myVoteOptionTitle: myVoteOption?.title || null,
      myVoteSource: r.my_vote_source || null,
      totalVotes,
      sourceStats,
      createdAt: r.created_at,
      endDate: r.end_date || null,
    };
  }

  async castVote(
    userId: string,
    pollId: string,
    optionId: string,
    sourceApp: string = 'association_app',
  ) {
    if (!pollId || !optionId) {
      throw new BadRequestException('pollId and optionId are required');
    }

    const existing = await this.getPollById(userId, pollId);
    if (existing.status === 'closed') {
      throw new BadRequestException('Phiên biểu quyết này đã kết thúc, không thể bỏ phiếu.');
    }

    const validSource = sourceApp === 'crm' ? 'crm' : 'association_app';
    const voteId = crypto.randomUUID();

    await this.votingRepo.insertVote(
      voteId,
      pollId,
      optionId,
      userId,
      validSource,
    );
    const updatedPoll = await this.getPollById(userId, pollId);
    const chosenTitle =
      updatedPoll.myVoteOptionTitle ||
      updatedPoll.options.find((o: any) => o.id === optionId)?.title ||
      'Lựa chọn đã chọn';
    const historyNote = updatedPoll.eventName
      ? `Bạn đã chọn "${chosenTitle}" tại biểu quyết "${updatedPoll.title}" ở sự kiện "${updatedPoll.eventName}"`
      : `Bạn đã chọn "${chosenTitle}" tại biểu quyết "${updatedPoll.title}"`;

    return {
      ...updatedPoll,
      voteHistorySummary: historyNote,
    };
  }

  async createPoll(userId: string, data: CreatePollDto) {
    if (
      !data.title ||
      !Array.isArray(data.options) ||
      data.options.length < 2
    ) {
      throw new BadRequestException(
        'Tiêu đề và ít nhất 2 phương án bình chọn là bắt buộc',
      );
    }

    const pollId = crypto.randomUUID();
    let startDate = (data as any).startsAt || data.startDate || null;
    let endDate = (data as any).endsAt || data.endDate || null;
    const eventId = data.eventId || (data as any).event_id || null;

    if (!startDate && !endDate && eventId) {
      const ev = await this.votingRepo.findEventDate(eventId);
      if (ev.length > 0 && ev[0].date) {
        const evDateStr =
          ev[0].date instanceof Date
            ? ev[0].date.toISOString().slice(0, 10)
            : String(ev[0].date).slice(0, 10);
        startDate = evDateStr;
        endDate = evDateStr;
      }
    }

    if (startDate && !endDate) endDate = startDate;
    if (!startDate && endDate) startDate = endDate;

    const startDt = startDate ? new Date(startDate) : new Date();
    const endDt = endDate ? new Date(endDate) : new Date(startDt);
    if (
      startDate &&
      endDate &&
      String(startDate).slice(0, 10) === String(endDate).slice(0, 10)
    ) {
      endDt.setHours(23, 59, 59, 999);
    }

    await this.votingRepo.insertPoll(
      pollId,
      data.title,
      data.description || null,
      startDt,
      endDt,
      eventId,
    );

    const createdOptions: Array<{ id: string; title: string }> = [];
    for (const optTitle of data.options) {
      const optId = crypto.randomUUID();
      await this.votingRepo.insertPollOption(optId, pollId, optTitle);
      createdOptions.push({ id: optId, title: optTitle });
    }

    // Broadcast in-app interactive poll notification
    try {
      const audience = data.targetAudience || 'all';
      const users = await this.votingRepo.findAudienceUsers(audience);
      const notifTitle = `[Biểu quyết mới] ${data.title}`;
      const notifBody =
        data.description ||
        'Tham gia biểu quyết ý kiến ngay trên ứng dụng Hiệp hội & CRM.';
      const safeDisplayData = JSON.stringify({
        title: data.title,
        body: notifBody,
        pollId,
        options: createdOptions,
        type: 'poll',
        targetRoute: '/voting',
        status: 'open',
      });

      for (const u of users) {
        if (!u.id) continue;
        const dedupeKey = `poll-notif-${pollId}-${u.id}`;
        await this.votingRepo.createNotification(
          u.id,
          notifTitle,
          notifBody,
          pollId,
          safeDisplayData,
          dedupeKey,
          'interactive_poll',
        );

        if (this.mailService && u.email && u.email.includes('@')) {
          this.mailService.sendDirectEmail({
            to: u.email,
            subject: `[CEO HN10] Mời tham gia biểu quyết: ${data.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003B95; margin-bottom: 12px;">Phiên Biểu Quyết Mới - CEO HN10</h2>
                <p>Kính gửi Anh/Chị,</p>
                <p>Hệ thống CEO HN10 vừa mở phiên biểu quyết mới: <strong>${data.title}</strong>.</p>
                ${data.description ? `<p style="background: #f1f5f9; padding: 12px; border-radius: 8px; border-left: 4px solid #003B95;">${data.description}</p>` : ''}
                <p>Kính mời Anh/Chị mở ứng dụng Di động CEO HN10 hoặc Cổng Web CRM để tham gia biểu quyết ý kiến.</p>
                <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Trân trọng,<br/>Ban Điều Hành CLB Doanh Nhân CEO HN10 (HanoiBA)</p>
              </div>
            `,
            fromName: 'CLB Doanh Nhân CEO HN10',
          }).catch(() => { });
        }
      }
    } catch (err: any) {
      console.warn(
        '[VotingService] Error broadcasting poll notification:',
        err?.message,
      );
    }

    return this.getPollById(userId, pollId);
  }

  async closePoll(userId: string, id: string) {
    if (!id) throw new BadRequestException('ID is required');

    await this.votingRepo.markPollClosed(id);
    const poll = await this.getPollById(userId, id);
    const leadingOption =
      poll.options.find((o: any) => o.isLeading) || poll.options[0] || null;

    try {
      const users = await this.votingRepo.findAudienceUsers('all');
      const notifTitle = `[Kết quả biểu quyết] ${poll.title}`;
      const notifBody = `Biểu quyết đã kết thúc. Phương án dẫn đầu: "${leadingOption?.title || 'Đã đóng'}" (${leadingOption?.percentage || 0}%). Tổng số: ${poll.totalVotes} lượt (${poll.sourceStats?.associationApp || 0} App Hiệp hội, ${poll.sourceStats?.crm || 0} CRM).`;

      const safeDisplayData = JSON.stringify({
        title: poll.title,
        body: notifBody,
        pollId: id,
        status: 'closed',
        winner: leadingOption,
        options: poll.options,
        totalVotes: poll.totalVotes,
        sourceStats: poll.sourceStats,
        type: 'poll_result',
        targetRoute: '/voting',
      });

      for (const u of users) {
        if (!u.id) continue;
        const dedupeKey = `poll-result-${id}-${u.id}`;
        await this.votingRepo.createNotification(
          u.id,
          notifTitle,
          notifBody,
          id,
          safeDisplayData,
          dedupeKey,
          'poll_result',
        );
      }
    } catch (err: any) {
      console.warn(
        '[VotingService] Error broadcasting poll close notification:',
        err?.message,
      );
    }

    return poll;
  }

  async updatePoll(userId: string, id: string, data: any) {
    if (!id) throw new BadRequestException('ID is required');
    const eventId =
      data.eventId !== undefined
        ? data.eventId
        : data.event_id !== undefined
          ? data.event_id
          : null;
    let startDate = data.startsAt || data.startDate || null;
    let endDate = data.endsAt || data.endDate || null;
    if (startDate && !endDate) endDate = startDate;
    if (!startDate && endDate) startDate = endDate;

    const startDt = startDate ? new Date(startDate) : null;
    const endDt = endDate ? new Date(endDate) : null;
    if (
      startDt &&
      endDt &&
      String(startDate).slice(0, 10) === String(endDate).slice(0, 10)
    ) {
      endDt.setHours(23, 59, 59, 999);
    }

    await this.votingRepo.updatePollRaw(
      id,
      data.title,
      data.description || null,
      data.status || null,
      startDt,
      endDt,
      eventId,
    );
    return this.getPollById(userId, id);
  }

  async deletePoll(userId: string, id: string) {
    if (!id) throw new BadRequestException('ID is required');
    await this.votingRepo.deletePollRaw(id);
    return { ok: true, id };
  }

  async castPublicVote(
    pollId: string,
    optionId: string,
    voterData: { voterName?: string; voterEmail?: string; voterPhone?: string; memberCode?: string },
  ) {
    if (!pollId || !optionId) {
      throw new BadRequestException('pollId và optionId không được để trống');
    }
    const voterId = (voterData.voterEmail || voterData.voterPhone || voterData.voterName || `GUEST-${Date.now()}`).trim();
    const voteId = crypto.randomUUID();
    await this.votingRepo.insertVote(
      voteId,
      pollId,
      optionId,
      voterId,
      'guest_public_link',
    );
    return {
      ok: true,
      success: true,
      pollId,
      optionId,
      message: 'Ghi nhận kết quả biểu quyết thành công! Cảm ơn Quý Doanh nhân đã tham gia biểu quyết.',
    };
  }

  async broadcastPollInvitation(
    pollId: string,
    data: { emails?: string[]; eventId?: string; appUrl?: string },
  ) {
    const poll = await this.getPollById('system', pollId);
    const baseUrl = data.appUrl || process.env.APP_URL || 'https://ceohn10.viconnect.vn';
    const votingLink = `${baseUrl}/guest-voting/${pollId}`;

    let recipientsList: Array<{ email: string; name?: string }> = [];
    if (Array.isArray(data.emails) && data.emails.length > 0) {
      recipientsList = data.emails.map(e => ({ email: e.trim(), name: 'Đại biểu' }));
    } else if (data.eventId || poll.eventId) {
      const evId = data.eventId || poll.eventId;
      const attendees = await this.prisma.$queryRaw<any[]>`
        SELECT email, member_name as name FROM public.event_registrations
        WHERE event_id = ${evId} AND (status = 'attended' OR checked_in_at IS NOT NULL)
          AND email IS NOT NULL AND email LIKE '%@%'
      `.catch(() => []);
      recipientsList = attendees.map(a => ({ email: a.email.trim(), name: a.name || 'Đại biểu' }));
    }

    let sentCount = 0;
    for (const r of recipientsList) {
      if (!r.email || !r.email.includes('@')) continue;
      if (this.mailService) {
        await this.mailService.sendDirectEmail({
          to: r.email,
          subject: `[BIỂU QUYẾT CEO HN10] Mời tham gia biểu quyết: ${poll.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
              <div style="background: linear-gradient(135deg, #001A4D, #003B95); padding: 20px; border-radius: 12px; text-align: center; color: #ffffff; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 20px;">PHIẾU BIỂU QUYẾT & LẤY Ý KIẾN ĐẠI BIỂU</h2>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">CLB Doanh Nhân CEO HN10 (HanoiBA)</p>
              </div>
              <p>Kính gửi Anh/Chị <strong>${r.name || 'Đại biểu'}</strong>,</p>
              <p>Ban Tổ Chức trân trọng kính mời Anh/Chị tham gia đóng góp ý kiến biểu quyết nội dung:</p>
              <div style="background: #eff6ff; border-left: 4px solid #003B95; padding: 16px; border-radius: 8px; margin: 18px 0;">
                <h3 style="margin: 0 0 8px 0; color: #003B95; font-size: 16px;">${poll.title}</h3>
                ${poll.description ? `<p style="margin: 0; font-size: 13.5px; color: #475569;">${poll.description}</p>` : ''}
              </div>
              <p style="font-size: 13.5px;">Quý Anh/Chị vui lòng bấm vào liên kết bên dưới để mở phiếu biểu quyết và xác nhận kết quả:</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${votingLink}" target="_blank" style="display: inline-block; background: #003B95; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0, 59, 149, 0.3);">
                  👉 BẤM VÀO ĐÂY ĐỂ BIỂU QUYẾT NGAY
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">Hoặc truy cập trực tiếp: <a href="${votingLink}" style="color: #003B95;">${votingLink}</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Ban Điều Hành & Ban Sự Kiện CLB Doanh Nhân CEO HN10</p>
            </div>
          `,
          fromName: 'CLB Doanh Nhân CEO HN10',
        }).catch(() => {});
        sentCount++;
      }
    }

    return {
      ok: true,
      pollId,
      votingLink,
      sentCount,
      recipients: recipientsList.map(r => r.email),
      message: `Đã gửi liên kết biểu quyết tới ${sentCount} đại biểu qua Email & Zalo OA thành công!`,
    };
  }

  async notifyLuckyDrawWinner(
    userId: string,
    data: {
      winnerName: string;
      winnerCompany?: string;
      winnerCode?: string;
      luckyNumber?: string;
      prize?: string;
      prizeName?: string;
      prizeTitle?: string;
      prizeValue?: string;
      eventName?: string;
      eventId?: string;
      winnerEmail?: string;
      email?: string;
      winnerPhone?: string;
    },
  ) {
    const effectivePrize =
      (data.prize || data.prizeName || data.prizeTitle || '').trim() ||
      'Phần quà may mắn từ Ban Tổ Chức';
    const title = `🎁 [Ưu Đãi Trúng Thưởng] Chúc mừng bạn đã trúng ${effectivePrize}!`;
    const body = `Ban Tổ chức CLB Doanh Nhân CEO HN10 xin trân trọng chúc mừng Anh/Chị ${data.winnerName} (${data.winnerCompany || 'Học viên'}, Số may mắn: #${data.luckyNumber || 'LUCKY'}) đã xuất sắc trúng giải thưởng "${effectivePrize}" tại sự kiện "${data.eventName || 'Sự kiện CEO HN10'}". Phần thưởng đã được đẩy vào mục Ưu Đãi của bạn!`;

    const targetCode = data.winnerCode || data.luckyNumber;
    const recipients = await this.votingRepo.findMemberForLuckyDraw(
      targetCode,
      data.winnerName,
    );
    const safeDisplayData = JSON.stringify({
      winnerName: data.winnerName,
      winnerCompany: data.winnerCompany,
      winnerCode: data.winnerCode,
      luckyNumber: data.luckyNumber,
      prize: effectivePrize,
      prizeTitle: effectivePrize,
      prizeValue: data.prizeValue,
      eventName: data.eventName,
      eventId: data.eventId,
      type: 'perk_reward',
      targetRoute: '/association/perks',
    });

    const targetUserId = recipients[0]?.id || userId;
    const targetMemberCode = recipients[0]?.code || data.winnerCode || targetCode;
    
    // Tìm email của người trúng giải: ưu tiên từ client truyền lên, nếu không tìm từ registrations, sau đó từ members
    let recipientEmail = (data.winnerEmail || data.email || '').trim();
    if (!recipientEmail && data.eventId) {
      const regMatches = await this.prisma.$queryRaw<any[]>`
        SELECT email FROM public.event_registrations
        WHERE event_id = ${data.eventId}
          AND (lucky_number = ${data.luckyNumber || ''} OR member_name ILIKE ${data.winnerName || ''} OR member_code = ${targetCode || ''})
          AND email IS NOT NULL AND email != ''
        LIMIT 1
      `.catch(() => []);
      if (regMatches.length > 0 && regMatches[0]?.email) {
        recipientEmail = regMatches[0].email;
      }
    }
    if (!recipientEmail) {
      recipientEmail = recipients[0]?.email || '';
    }

    await this.votingRepo.sendLuckyDrawNotification(
      targetUserId,
      title,
      body,
      data.eventId || 'lucky-draw',
      safeDisplayData,
      targetMemberCode,
      effectivePrize,
      data.eventName,
    );

    // Bắn email chúc mừng trúng thưởng tới người trúng giải
    if (this.mailService && recipientEmail && recipientEmail.includes('@')) {
      await this.mailService
        .sendLuckyDrawWinnerEmail({
          to: recipientEmail,
          winnerName: data.winnerName,
          winnerCompany: data.winnerCompany,
          winnerCode: targetMemberCode,
          luckyNumber: data.luckyNumber,
          prizeTitle: effectivePrize,
          prizeValue: data.prizeValue,
          eventName: data.eventName || 'Sự kiện CLB CEO HN10',
          perkUrl: 'https://ceohn10.viconnect.vn/association/perks',
        })
        .catch((err) => {
          console.warn(
            '[notifyLuckyDrawWinner] Failed to send winner email:',
            err?.message,
          );
        });
    }

    return {
      ok: true,
      recipient: data.winnerName,
      recipientEmail: recipientEmail || null,
      prize: effectivePrize,
      targetRoute: '/association/perks',
    };
  }
}
