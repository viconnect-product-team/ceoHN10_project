import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { optionalNestAuth, requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type MyEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  place: string;
  registered: boolean;
  date?: string;
  isToday?: boolean;
  communityName?: string | null;
  associationName?: string | null;
  associationId?: string | null;
  image?: string | null;
  banner?: string | null;
  ticketPrice?: number;
  fee?: number;
  capacity?: number;
  maxAttendees?: number;
  registeredCount?: number;
  isFull?: boolean;
  qrScanners?: string[];
  qrStaff?: string[];
  description?: string;
  sponsors?: any[];
};

export function isEventFull(e: any): boolean {
  if (!e) return false;
  if (e.isFull === true) return true;
  const cap = Number(e.capacity ?? e.maxAttendees ?? e.maxSeats ?? 0);
  const reg = Number(e.registeredCount ?? e.registered ?? e.attendeesCount ?? e.registrations ?? e.confirmed ?? 0);
  return cap > 0 && reg >= cap;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ---------- Events ----------

export const listMyEvents = createServerFn({ method: "GET" })
  .middleware([optionalNestAuth])
  .handler(async ({ context }): Promise<MyEvent[]> => {
    const token = (context as any)?.token;
    try {
      const data = await fetchNestApiFromServer("/events/my-events", token);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err: any) {
      console.warn("[listMyEvents] Error fetching from /events/my-events, falling back to /events:", err?.message);
    }

    try {
      const fallback = await fetchNestApiFromServer("/events", token);
      if (Array.isArray(fallback)) {
        return fallback.map((e: any) => ({
          id: e.id,
          day: e.day || (e.date ? new Date(e.date).getDate().toString() : "20"),
          month: e.month || (e.date ? `TH${new Date(e.date).getMonth() + 1}` : "TH10"),
          title: e.name || e.title || "Sự kiện CLB CEO HN10",
          time: e.time || `${e.start_time || "08:00"} - ${e.end_time || "11:30"}`,
          place: e.location || "CLB Doanh Nhân CEO HN10",
          registered: Boolean(e.registered),
          date: e.date,
          description: e.description,
          image: e.image || e.banner,
          banner: e.banner || e.image,
          ticketPrice: Number(e.ticket_price || e.fee || 0),
          fee: Number(e.fee || e.ticket_price || 0),
          capacity: Number(e.capacity || 0),
        }));
      }
    } catch (fErr: any) {
      console.warn("[listMyEvents] Fallback /events also failed:", fErr?.message);
    }
    return [];
  });

export const registerForEvent = createServerFn({ method: "POST" })
  .middleware([optionalNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        eventId: z.string().min(1).max(64),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        ticketCount: z.number().int().min(1).max(100).optional(),
        ticketType: z.string().optional(),
        note: z.string().optional(),
        confirmOverlap: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; message?: string; registrationId?: string }> => {
    return fetchNestApiFromServer(`/events/${encodeURIComponent(data.eventId)}/register`, (context as any)?.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const cancelEventRegistration = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        eventId: z.string().min(1).max(64),
        reason: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer(`/events/${encodeURIComponent(data.eventId)}/cancel`, (context as any)?.token, {
      method: "POST",
      body: JSON.stringify({ reason: data.reason }),
    });
  });
