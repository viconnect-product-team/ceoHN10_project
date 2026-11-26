import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SponsorsRepository implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma
      .$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.sponsor_packages (
          id TEXT PRIMARY KEY,
          tier TEXT NOT NULL,
          price BIGINT NOT NULL DEFAULT 0,
          benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
          available INT NOT NULL DEFAULT 10,
          sold INT NOT NULL DEFAULT 0,
          association_id UUID,
          package_type TEXT DEFAULT 'cash',
          in_kind_description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS public.sponsors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          tier TEXT NOT NULL DEFAULT 'gold',
          sponsor_type TEXT DEFAULT 'enterprise',
          package_type TEXT DEFAULT 'cash',
          in_kind_description TEXT,
          contact TEXT DEFAULT '',
          email TEXT DEFAULT '',
          phone TEXT DEFAULT '',
          amount BIGINT NOT NULL DEFAULT 0,
          events INT NOT NULL DEFAULT 0,
          since DATE,
          status TEXT DEFAULT 'active',
          association_id UUID,
          birth_date DATE,
          age INT,
          website TEXT,
          company_name TEXT,
          in_kind_items JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .catch(() => {});
  }

  async resolveDefaultAssociationId(): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.associations 
      ORDER BY landing_published DESC, created_at DESC 
      LIMIT 1
    `.catch(() => []);
    return rows[0]?.id || null;
  }

  // ── PACKAGES ──────────────────────────────────────────────────────────

  async listPackagesRaw(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.sponsor_packages
      ORDER BY created_at DESC
    `;
  }

  async getPackageByIdRaw(id: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.sponsor_packages WHERE id = ${id} LIMIT 1
    `;
  }

  async getLastPackageId(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.sponsor_packages WHERE id ~ '^[0-9]+$' ORDER BY CAST(id AS BIGINT) DESC LIMIT 1
    `.catch(() => []);
  }

  async insertPackage(
    id: string,
    tier: string,
    price: bigint,
    benefits: string[],
    available: number,
    sold: number,
    associationId: string,
    packageType: string,
    inKindDescription: string | null,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.sponsor_packages (id, tier, price, benefits, available, sold, association_id, package_type, in_kind_description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8, $9, NOW(), NOW())`,
      id,
      tier,
      price,
      benefits || [],
      available,
      sold,
      associationId,
      packageType,
      inKindDescription,
    );
  }

  async updatePackageRaw(
    id: string,
    tier: string,
    price: bigint,
    benefits: string[],
    available: number,
    sold: number,
    packageType: string,
    inKindDescription: string | null,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE public.sponsor_packages
       SET tier = $2, price = $3, benefits = $4, available = $5, sold = $6,
           package_type = $7, in_kind_description = $8, updated_at = NOW()
       WHERE id = $1`,
      id,
      tier,
      price,
      benefits || [],
      available,
      sold,
      packageType,
      inKindDescription,
    );
  }

  async deletePackageRaw(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.sponsor_packages WHERE id = ${id}
    `;
  }

  async incrementPackageSold(packageId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.sponsor_packages
      SET sold = sold + 1, updated_at = NOW()
      WHERE id = ${packageId}
    `;
  }

  // ── SPONSORS ──────────────────────────────────────────────────────────

  async listSponsorsRaw(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.sponsors
      ORDER BY amount DESC, created_at DESC
    `;
  }

  async listEventsWithSponsors(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, name, date, sponsors, status FROM public.events
      WHERE sponsors IS NOT NULL
    `.catch(() => []);
  }

  async getSponsorByIdRaw(id: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.sponsors WHERE id = ${id} LIMIT 1
    `;
  }

  async getLastSponsorId(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.sponsors WHERE id ~ '^[0-9]+$' ORDER BY CAST(id AS BIGINT) DESC LIMIT 1
    `.catch(() => []);
  }

  async insertSponsor(
    id: string,
    name: string,
    tier: string,
    sponsorType: string,
    packageType: string,
    inKindDescription: string | null,
    contact: string,
    email: string,
    phone: string,
    amount: bigint,
    events: number,
    since: string,
    status: string,
    associationId: string,
    birthDate?: string | null,
    age?: number | null,
    website?: string | null,
    companyName?: string | null,
    inKindItems?: any[],
  ): Promise<void> {
    const inKindJson = inKindItems ? JSON.stringify(inKindItems) : '[]';
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.sponsors (
        id, name, tier, sponsor_type, package_type, in_kind_description,
        contact, email, phone, amount, events, since, status, association_id,
        birth_date, age, website, company_name, in_kind_items, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12::date, $13, $14::uuid,
        $15::date, $16, $17, $18, $19::jsonb, NOW(), NOW()
      )`,
      id,
      name,
      tier,
      sponsorType,
      packageType,
      inKindDescription,
      contact,
      email,
      phone,
      amount,
      events,
      since,
      status,
      associationId,
      birthDate || null,
      age || null,
      website || null,
      companyName || null,
      inKindJson,
    );
  }

  async updateSponsorRaw(
    id: string,
    name: string,
    tier: string,
    sponsorType: string,
    packageType: string,
    inKindDescription: string | null,
    contact: string,
    email: string,
    phone: string,
    amount: bigint,
    events: number,
    since: string,
    status: string,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE public.sponsors
       SET name = $2, tier = $3, sponsor_type = $4, package_type = $5, in_kind_description = $6,
           contact = $7, email = $8, phone = $9,
           amount = $10, events = $11, since = $12::date, status = $13, updated_at = NOW()
       WHERE id = $1`,
      id,
      name,
      tier,
      sponsorType,
      packageType,
      inKindDescription,
      contact,
      email,
      phone,
      amount,
      events,
      since,
      status,
    );
  }

  async deleteSponsorRaw(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.sponsors WHERE id = ${id}
    `;
  }

  // ── PRIZES ────────────────────────────────────────────────────────────

  async listPrizesRaw(eventId?: string): Promise<any[]> {
    if (eventId) {
      return this.prisma.$queryRaw<any[]>`
        SELECT ep.*, p.name as prod_name, p.company as prod_company, p.price as prod_price, p.image_url as prod_image,
               sp.tier as pkg_tier, sp.price as pkg_price
        FROM public.event_prizes ep
        LEFT JOIN public.products p ON ep.target_id = p.id
        LEFT JOIN public.sponsor_packages sp ON ep.target_id = sp.id
        WHERE ep.event_id = ${eventId}
        ORDER BY ep.created_at ASC
      `;
    }
    return this.prisma.$queryRaw<any[]>`
      SELECT ep.*, p.name as prod_name, p.company as prod_company, p.price as prod_price, p.image_url as prod_image,
             sp.tier as pkg_tier, sp.price as pkg_price
      FROM public.event_prizes ep
      LEFT JOIN public.products p ON ep.target_id = p.id
      LEFT JOIN public.sponsor_packages sp ON ep.target_id = sp.id
      ORDER BY ep.created_at ASC
    `;
  }

  async getPrizeByIdRaw(id: string): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw<any[]>`
        SELECT ep.*, p.name as prod_name, p.company as prod_company, p.price as prod_price, p.image_url as prod_image
        FROM public.event_prizes ep
        LEFT JOIN public.products p ON ep.target_id::text = p.id::text
        WHERE ep.id = ${id}
        LIMIT 1
      `;
    } catch {
      return this.prisma.$queryRaw<any[]>`
        SELECT ep.*
        FROM public.event_prizes ep
        WHERE ep.id = ${id}
        LIMIT 1
      `.catch(() => []);
    }
  }

  async findProductForPrize(productId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT name, title, company, price, image_url, description FROM public.products WHERE id = ${productId} LIMIT 1
    `.catch(() => []);
  }

  async findPackageForPrize(packageId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT tier, price, in_kind_description FROM public.sponsor_packages WHERE id = ${packageId} LIMIT 1
    `.catch(() => []);
  }

  async insertPrize(
    id: string,
    eventId: string,
    rankName: string,
    title: string,
    value: string,
    amount: bigint,
    quantity: number,
    targetType: string,
    targetId: string | null,
    sponsorName: string,
    sponsorPackageId: string | null,
    description: string,
    iconName: string,
    imageUrl: string | null,
    highlightColor: string,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.event_prizes (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        rank_name TEXT DEFAULT 'Giải Thưởng',
        title TEXT NOT NULL,
        value TEXT DEFAULT '',
        amount BIGINT DEFAULT 0,
        quantity INT DEFAULT 1,
        target_type TEXT DEFAULT 'PRODUCT',
        target_id TEXT,
        sponsor_name TEXT DEFAULT '',
        sponsor_package_id TEXT,
        description TEXT DEFAULT '',
        icon_name TEXT DEFAULT 'Gift',
        image_url TEXT,
        highlight_color TEXT DEFAULT 'from-amber-500 to-yellow-600',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {});

    await this.prisma.$executeRaw`
      INSERT INTO public.event_prizes (
        id, event_id, rank_name, title, value, amount, quantity,
        target_type, target_id, sponsor_name, sponsor_package_id,
        description, icon_name, image_url, highlight_color, status,
        created_at, updated_at
      ) VALUES (
        ${id}, ${eventId}, ${rankName}, ${title}, ${value}, ${amount}, ${quantity},
        ${targetType}, ${targetId}, ${sponsorName}, ${sponsorPackageId},
        ${description}, ${iconName}, ${imageUrl}, ${highlightColor}, 'active',
        NOW(), NOW()
      )
    `;
  }

  async updatePrizeRaw(
    id: string,
    eventId: string,
    rankName: string,
    title: string,
    value: string,
    amount: bigint,
    quantity: number,
    targetType: string,
    targetId: string | null,
    sponsorName: string,
    sponsorPackageId: string | null,
    description: string,
    iconName: string,
    imageUrl: string | null,
    highlightColor: string,
    status: string,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.event_prizes
      SET event_id = ${eventId}, rank_name = ${rankName}, title = ${title}, value = ${value},
          amount = ${amount}, quantity = ${quantity}, target_type = ${targetType}, target_id = ${targetId},
          sponsor_name = ${sponsorName}, sponsor_package_id = ${sponsorPackageId}, description = ${description},
          icon_name = ${iconName}, image_url = ${imageUrl}, highlight_color = ${highlightColor},
          status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  async deletePrizeRaw(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.event_prizes WHERE id = ${id}
    `;
  }
}
