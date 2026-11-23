import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function parseJsonArraySafe(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
    } catch {}
  }
  return [];
}

@Injectable()
export class EventsCheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async getTicketStatus(ticketCode: string) {
    if (!ticketCode || !ticketCode.trim()) {
      throw new BadRequestException('Mã vé không được để trống');
    }
    const clean = ticketCode.trim();
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.title as event_title, e.date as event_date, e.location as event_location, e.start_time, e.end_time
      FROM public.event_registrations r
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE r.id = ${clean} 
         OR UPPER(TRIM(r.member_code)) = UPPER(${clean})
         OR r.lucky_number = ${clean}
      ORDER BY r.created_at DESC
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      return { found: false, message: 'Không tìm thấy vé hoặc mã đăng ký trên hệ thống.' };
    }

    const reg = rows[0];
    const isCheckedIn = Boolean(reg.checked_in_at);
    const isCheckedOut = Boolean(reg.checked_out_at);
    const isWalkIn = reg.is_walkin === true || reg.registration_origin === 'walkin_at_door';
    const attendeeType = isWalkIn ? 'WALK_IN_NEW' : 'PRE_REGISTERED';
    const attendeeTypeLabel = isWalkIn ? 'Khách mới đăng ký tại sự kiện' : 'Đại biểu đã đăng ký từ trước';

    return {
      found: true,
      ticket: {
        id: reg.id,
        eventId: reg.event_id,
        eventTitle: reg.event_name || reg.event_title || 'Sự kiện CEO HN10',
        eventDate: reg.event_date ? new Date(reg.event_date).toLocaleDateString('vi-VN') : 'Sắp diễn ra',
        eventTime: `${reg.start_time || '08:30'} - ${reg.end_time || '12:00'}`,
        eventLocation: reg.event_location || 'Hà Nội',
        memberName: reg.member_name,
        memberCode: reg.member_code,
        phone: reg.phone,
        email: reg.email,
        company: reg.company || 'Khách mời',
        position: reg.position || 'Đại biểu',
        ticketType: reg.ticket_type,
        ticketCount: reg.ticket_count || 1,
        paymentStatus: reg.payment_status || 'free',
        paymentAmount: Number(reg.payment_amount || 0),
        luckyNumber: reg.lucky_number,
        seatAssignment: reg.seat_assignment,
        isWalkIn,
        attendeeType,
        attendeeTypeLabel,
        registrationOrigin: reg.registration_origin || 'pre_registered',
        isCheckedIn,
        checkedInAt: reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString('vi-VN') : null,
        isCheckedOut,
        checkedOutAt: reg.checked_out_at ? new Date(reg.checked_out_at).toLocaleString('vi-VN') : null,
      },
    };
  }

  async performTicketCheckin(ticketCode: string, method: string = 'web', attendedParts?: string[]) {
    if (!ticketCode || !ticketCode.trim()) {
      throw new BadRequestException('Mã vé không được để trống');
    }
    const clean = ticketCode.trim();
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.title as event_title, e.association_id as event_assoc_id
      FROM public.event_registrations r
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE r.id = ${clean} 
         OR UPPER(TRIM(r.member_code)) = UPPER(${clean})
         OR r.lucky_number = ${clean}
      ORDER BY r.created_at DESC
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin vé đăng ký với mã: ' + clean);
    }

    const reg = rows[0];

    // Chặn check-in trùng lặp (Strict 1-Time Check-In Enforcement)
    if (reg.checked_in_at) {
      const formattedTime = new Date(reg.checked_in_at).toLocaleString('vi-VN');
      return {
        ok: false,
        alreadyCheckedIn: true,
        message: `Vé này ĐÃ ĐƯỢC CHECK-IN lúc ${formattedTime}! Không thể check-in lại.`,
        checkedInAt: formattedTime,
        ticket: {
          id: reg.id,
          memberName: reg.member_name,
          eventTitle: reg.event_name || reg.event_title,
          phone: reg.phone,
          company: reg.company,
          attendedParts: parseJsonArraySafe(reg.attended_parts),
        },
      };
    }

    const partsArray = Array.isArray(attendedParts) && attendedParts.length > 0 
      ? attendedParts 
      : parseJsonArraySafe(reg.attended_parts);
    const partsJson = JSON.stringify(partsArray);

    await this.prisma.$executeRawUnsafe(`
      UPDATE public.event_registrations
      SET checked_in_at = NOW(), status = 'attended', attended_parts = $1::jsonb, updated_at = NOW()
      WHERE id = $2
    `, partsJson, reg.id);

    // Ghi nhận vào member_checkins
    const clientId = `chk:tkt:${reg.association_id || 'ceohn10'}:${reg.member_code}:${reg.event_id || 'any'}`;
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_checkins (
        id, client_id, member_code, event_id, event_title, status, method, checked_at, association_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'attended', $5, NOW(), $6
      )
      ON CONFLICT DO NOTHING
    `, clientId, reg.member_code, reg.event_id, reg.event_name || 'Sự kiện CEO HN10', method, reg.association_id || reg.event_assoc_id || '00000000-0000-0000-0000-000000000000')
    .catch(() => {});

    const isWalkIn = reg.is_walkin === true || reg.registration_origin === 'walkin_at_door';

    return {
      ok: true,
      success: true,
      message: `Check-in thành công cho đại biểu ${reg.member_name}!`,
      ticket: {
        id: reg.id,
        memberName: reg.member_name,
        memberCode: reg.member_code,
        eventTitle: reg.event_name || reg.event_title,
        ticketType: reg.ticket_type,
        seatAssignment: reg.seat_assignment,
        luckyNumber: reg.lucky_number,
        isWalkIn,
        attendeeType: isWalkIn ? 'WALK_IN_NEW' : 'PRE_REGISTERED',
        attendeeTypeLabel: isWalkIn ? 'Khách mới đăng ký tại sự kiện' : 'Đại biểu đã đăng ký từ trước',
        attendedParts: partsArray,
        checkedInAt: new Date().toLocaleString('vi-VN'),
      },
    };
  }

  async performTicketCheckout(ticketCode: string) {
    if (!ticketCode || !ticketCode.trim()) {
      throw new BadRequestException('Mã vé không được để trống');
    }
    const clean = ticketCode.trim();
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT r.*, e.name as event_name, e.title as event_title
      FROM public.event_registrations r
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE r.id = ${clean} 
         OR UPPER(TRIM(r.member_code)) = UPPER(${clean})
         OR r.lucky_number = ${clean}
      ORDER BY r.created_at DESC
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy vé hợp lệ với mã: ' + clean);
    }

    const reg = rows[0];

    if (!reg.checked_in_at) {
      return {
        ok: false,
        notCheckedIn: true,
        message: 'Đại biểu này CHƯA CHECK-IN vào cửa, không thể thực hiện check-out.',
      };
    }

    if (reg.checked_out_at) {
      const formattedTime = new Date(reg.checked_out_at).toLocaleString('vi-VN');
      return {
        ok: false,
        alreadyCheckedOut: true,
        message: `Đại biểu đã check-out lúc ${formattedTime}.`,
      };
    }

    await this.prisma.$executeRawUnsafe(`
      UPDATE public.event_registrations
      SET checked_out_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, reg.id);

    return {
      ok: true,
      message: `Đã xác nhận check-out cho đại biểu ${reg.member_name}. Cảm ơn Quý khách!`,
      checkedOutAt: new Date().toLocaleString('vi-VN'),
    };
  }

  async getCheckedInCandidates(eventId: string) {
    if (!eventId) throw new BadRequestException('eventId is required');
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, member_name, member_code, email, phone, company, position, 
        lucky_number, checked_in_at, attended_parts, is_walkin
      FROM public.event_registrations
      WHERE event_id = ${eventId}
        AND checked_in_at IS NOT NULL
      ORDER BY checked_in_at ASC
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      name: r.member_name || r.member_code || 'Khách mời',
      memberCode: r.member_code,
      email: r.email,
      phone: r.phone,
      company: r.company || '',
      position: r.position || '',
      luckyNumber: r.lucky_number,
      checkedInAt: r.checked_in_at,
      attendedParts: parseJsonArraySafe(r.attended_parts),
      isWalkIn: Boolean(r.is_walkin),
    }));
  }
}
