import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNestApiFromServer } from "@/lib/api-client";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type AdminBenefit = {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  sortOrder: number;
};

type Row = Record<string, unknown>;

function mapBenefit(r: Row): AdminBenefit {
  return {
    id: (r.id as string) || "",
    titleVi: (r.title_vi as string) ?? (r.titleVi as string) ?? "",
    titleEn: (r.title_en as string) ?? (r.titleEn as string) ?? "",
    descVi: (r.desc_vi as string) ?? (r.descVi as string) ?? "",
    descEn: (r.desc_en as string) ?? (r.descEn as string) ?? "",
    sortOrder: (r.sort_order as number) ?? (r.sortOrder as number) ?? 0,
  };
}

async function activeAssociationId(context: any): Promise<string> {
  try {
    const { data } = await getDb(context).rpc("current_association_id");
    if (typeof data === "string" && data.length > 0) return data;
  } catch { }
  try {
    const { data: assoc } = await getDb(context).from("associations").select("id").limit(1).maybeSingle();
    return assoc?.id ?? "c1983000-0000-4000-8000-000000001983";
  } catch {
    return "c1983000-0000-4000-8000-000000001983";
  }
}

export const listBenefitsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AdminBenefit[]> => {
    const token = (context as any)?.token;
    try {
      const nestBenefits = await fetchNestApiFromServer<any[]>("/members/benefits/admin", token);
      if (Array.isArray(nestBenefits)) {
        return nestBenefits.map((r: any) => mapBenefit(r as Row));
      }
    } catch (e) {
      console.warn("Nest API listBenefitsAdmin error:", e);
    }

    try {
      const associationId = await activeAssociationId(context);
      const { data, error } = await getDb(context)
        .from("association_benefits")
        .select("*")
        .eq("association_id", associationId)
        .order("sort_order", { ascending: true });
      if (!error && Array.isArray(data)) {
        return data.map((r: any) => mapBenefit(r as Row));
      }
    } catch (err) {
      console.warn("Fallback to db for listBenefits failed:", err);
    }

    return [];
  });

const benefitInput = z.object({
  titleVi: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).default(""),
  descVi: z.string().trim().max(400).default(""),
  descEn: z.string().trim().max(400).default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

function toRow(d: z.infer<typeof benefitInput>) {
  return {
    title_vi: d.titleVi,
    title_en: d.titleEn,
    desc_vi: d.descVi,
    desc_en: d.descEn,
    sort_order: d.sortOrder,
  };
}

export const createBenefitFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => benefitInput.parse(d))
  .handler(async ({ data, context }): Promise<AdminBenefit> => {
    const token = (context as any)?.token;
    try {
      const created = await fetchNestApiFromServer<any>("/members/benefits/admin", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (created) return mapBenefit(created);
    } catch (e) {
      console.warn("Nest API createBenefit error:", e);
    }

    try {
      const associationId = await activeAssociationId(context);
      const { data: row, error } = await getDb(context)
        .from("association_benefits")
        .insert({ ...toRow(data), association_id: associationId })
        .select("*")
        .single();
      if (!error && row) {
        return mapBenefit(row);
      }
    } catch (err) {
      console.warn("Fallback db createBenefit failed:", err);
    }

    return {
      id: `BEN-${Date.now()}`,
      titleVi: data.titleVi,
      titleEn: data.titleEn,
      descVi: data.descVi,
      descEn: data.descEn,
      sortOrder: data.sortOrder,
    };
  });

export const updateBenefitFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => benefitInput.extend({ id: z.string() }).parse(d))
  .handler(async ({ data, context }): Promise<AdminBenefit> => {
    const token = (context as any)?.token;
    try {
      const updated = await fetchNestApiFromServer<any>(`/members/benefits/admin/${data.id}`, token, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (updated) return mapBenefit(updated);
    } catch (e) {
      console.warn("Nest API updateBenefit error:", e);
    }

    try {
      const associationId = await activeAssociationId(context);
      const { data: row, error } = await getDb(context)
        .from("association_benefits")
        .update(toRow(data))
        .eq("id", data.id)
        .eq("association_id", associationId)
        .select("*")
        .single();
      if (!error && row) {
        return mapBenefit(row);
      }
    } catch (err) {
      console.warn("Fallback db updateBenefit failed:", err);
    }

    return {
      id: data.id,
      titleVi: data.titleVi,
      titleEn: data.titleEn,
      descVi: data.descVi,
      descEn: data.descEn,
      sortOrder: data.sortOrder,
    };
  });

export const deleteBenefitFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const token = (context as any)?.token;
    try {
      await fetchNestApiFromServer<any>(`/members/benefits/admin/${data.id}`, token, {
        method: "DELETE",
      });
      return { ok: true };
    } catch (e) {
      console.warn("Nest API deleteBenefit error:", e);
    }

    try {
      const associationId = await activeAssociationId(context);
      await getDb(context)
        .from("association_benefits")
        .delete()
        .eq("id", data.id)
        .eq("association_id", associationId);
    } catch (err) {
      console.warn("Fallback db deleteBenefit failed:", err);
    }
    return { ok: true };
  });
