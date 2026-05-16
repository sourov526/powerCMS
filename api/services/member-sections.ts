import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { resolveMediaUrl } from "@/lib/media";
import type { MediaAsset } from "@/lib/services/posts";

export type MemberSection = {
  id: number;
  slug: string;
  isActive: boolean;
  name: string;
  subTitle?: string | null;
  title?: string | null;
  joinDate?: string | null;
  department?: string | null;
  description?: string | null;
  heroImageId?: number | null;
  heroImageMedia?: MediaAsset | null;
  joinedInformationQuestion?: string | null;
  joinedInformationAnswer?: string | null;
  joinedSectionImageId?: number | null;
  joinedSectionImageMedia?: MediaAsset | null;
  decisionMakingQuestion?: string | null;
  decisionMakingAnswer?: string | null;
  decisionSectionImageId?: number | null;
  decisionSectionImageMedia?: MediaAsset | null;
  appealingQuestion?: string | null;
  appealingAnswer?: string | null;
  appealingSectionImageId?: number | null;
  appealingSectionImageMedia?: MediaAsset | null;
  createdAt: string;
  updatedAt: string;
};

type MemberSectionRow = {
  id: number;
  slug: string;
  isActive: number;
  name: string;
  subTitle: string | null;
  title: string | null;
  joinDate: string | null;
  department: string | null;
  description: string | null;
  heroImage: number | null;
  joinedInformationQuestion: string | null;
  joinedInformationAnswer: string | null;
  joinedSectionImage: number | null;
  decisionMakingQuestion: string | null;
  decisionMakingAnswer: string | null;
  decisionSectionImage: number | null;
  appealingQuestion: string | null;
  appealingAnswer: string | null;
  appealingSectionImage: number | null;
  createdAt: string;
  updatedAt: string;
};

type MediaRow = {
  id: number;
  provider: string;
  key: string;
  bucket: string | null;
  url: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
} | null;

function mapMedia(media: MediaRow): MediaAsset | null {
  if (!media) return null;
  const resolvedUrl = resolveMediaUrl(media);
  const isRemote = media.provider === "r2" || media.provider === "s3";
  return {
    id: media.id,
    provider: isRemote ? "r2" : "local",
    key: media.key,
    bucket: media.bucket,
    url: resolvedUrl,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
  };
}

export async function getAllMemberSectionsForAdmin(): Promise<MemberSection[]> {
  await initCloudflareD1();
  const rows = await db.query<MemberSectionRow>(
    `SELECT * FROM member_section ORDER BY updatedAt DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    isActive: Boolean(row.isActive),
    name: row.name,
    subTitle: row.subTitle,
    title: row.title,
    joinDate: row.joinDate,
    department: row.department,
    description: row.description,
    heroImageId: row.heroImage,
    joinedInformationQuestion: row.joinedInformationQuestion,
    joinedInformationAnswer: row.joinedInformationAnswer,
    joinedSectionImageId: row.joinedSectionImage,
    decisionMakingQuestion: row.decisionMakingQuestion,
    decisionMakingAnswer: row.decisionMakingAnswer,
    decisionSectionImageId: row.decisionSectionImage,
    appealingQuestion: row.appealingQuestion,
    appealingAnswer: row.appealingAnswer,
    appealingSectionImageId: row.appealingSectionImage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getMemberSectionBySlug(
  slug: string,
): Promise<MemberSection | undefined> {
  await initCloudflareD1();
  const queryBySlug = async (value: string) =>
    db.queryOne<
      MemberSectionRow & {
      heroId: number | null;
      heroProvider: string | null;
      heroKey: string | null;
      heroBucket: string | null;
      heroUrl: string | null;
      heroMimeType: string | null;
      heroSize: number | null;
      heroWidth: number | null;
      heroHeight: number | null;
      joinedId: number | null;
      joinedProvider: string | null;
      joinedKey: string | null;
      joinedBucket: string | null;
      joinedUrl: string | null;
      joinedMimeType: string | null;
      joinedSize: number | null;
      joinedWidth: number | null;
      joinedHeight: number | null;
      decisionId: number | null;
      decisionProvider: string | null;
      decisionKey: string | null;
      decisionBucket: string | null;
      decisionUrl: string | null;
      decisionMimeType: string | null;
      decisionSize: number | null;
      decisionWidth: number | null;
      decisionHeight: number | null;
      appealingId: number | null;
      appealingProvider: string | null;
      appealingKey: string | null;
      appealingBucket: string | null;
      appealingUrl: string | null;
      appealingMimeType: string | null;
      appealingSize: number | null;
      appealingWidth: number | null;
      appealingHeight: number | null;
    }
  >(
    `SELECT ms.*,
            hero.id as heroId, hero.provider as heroProvider, hero.key as heroKey, hero.bucket as heroBucket, hero.url as heroUrl,
            hero.mimeType as heroMimeType, hero.size as heroSize, hero.width as heroWidth, hero.height as heroHeight,
            joined.id as joinedId, joined.provider as joinedProvider, joined.key as joinedKey, joined.bucket as joinedBucket, joined.url as joinedUrl,
            joined.mimeType as joinedMimeType, joined.size as joinedSize, joined.width as joinedWidth, joined.height as joinedHeight,
            decision.id as decisionId, decision.provider as decisionProvider, decision.key as decisionKey, decision.bucket as decisionBucket, decision.url as decisionUrl,
            decision.mimeType as decisionMimeType, decision.size as decisionSize, decision.width as decisionWidth, decision.height as decisionHeight,
            appealing.id as appealingId, appealing.provider as appealingProvider, appealing.key as appealingKey, appealing.bucket as appealingBucket, appealing.url as appealingUrl,
            appealing.mimeType as appealingMimeType, appealing.size as appealingSize, appealing.width as appealingWidth, appealing.height as appealingHeight
     FROM member_section ms
     LEFT JOIN media hero ON hero.id = ms.heroImage
     LEFT JOIN media joined ON joined.id = ms.joinedSectionImage
     LEFT JOIN media decision ON decision.id = ms.decisionSectionImage
     LEFT JOIN media appealing ON appealing.id = ms.appealingSectionImage
     WHERE ms.slug = ?
     LIMIT 1`,
    [value],
  );

  let row = await queryBySlug(slug);
  if (!row) {
    let alternate: string | null = null;
    if (slug.includes("%")) {
      try {
        alternate = decodeURIComponent(slug);
      } catch {
        alternate = null;
      }
    } else {
      const encoded = encodeURIComponent(slug);
      if (encoded !== slug) alternate = encoded;
    }
    if (alternate && alternate !== slug) {
      row = await queryBySlug(alternate);
    }
  }
  if (!row) return undefined;

  return {
    id: row.id,
    slug: row.slug,
    isActive: Boolean(row.isActive),
    name: row.name,
    subTitle: row.subTitle,
    title: row.title,
    joinDate: row.joinDate,
    department: row.department,
    description: row.description,
    heroImageId: row.heroImage,
    heroImageMedia: mapMedia(
      row.heroId
        ? {
            id: row.heroId,
            provider: row.heroProvider ?? "local",
            key: row.heroKey ?? "",
            bucket: row.heroBucket ?? null,
            url: row.heroUrl ?? null,
            mimeType: row.heroMimeType ?? null,
            size: row.heroSize ?? null,
            width: row.heroWidth ?? null,
            height: row.heroHeight ?? null,
          }
        : null,
    ),
    joinedInformationQuestion: row.joinedInformationQuestion,
    joinedInformationAnswer: row.joinedInformationAnswer,
    joinedSectionImageId: row.joinedSectionImage,
    joinedSectionImageMedia: mapMedia(
      row.joinedId
        ? {
            id: row.joinedId,
            provider: row.joinedProvider ?? "local",
            key: row.joinedKey ?? "",
            bucket: row.joinedBucket ?? null,
            url: row.joinedUrl ?? null,
            mimeType: row.joinedMimeType ?? null,
            size: row.joinedSize ?? null,
            width: row.joinedWidth ?? null,
            height: row.joinedHeight ?? null,
          }
        : null,
    ),
    decisionMakingQuestion: row.decisionMakingQuestion,
    decisionMakingAnswer: row.decisionMakingAnswer,
    decisionSectionImageId: row.decisionSectionImage,
    decisionSectionImageMedia: mapMedia(
      row.decisionId
        ? {
            id: row.decisionId,
            provider: row.decisionProvider ?? "local",
            key: row.decisionKey ?? "",
            bucket: row.decisionBucket ?? null,
            url: row.decisionUrl ?? null,
            mimeType: row.decisionMimeType ?? null,
            size: row.decisionSize ?? null,
            width: row.decisionWidth ?? null,
            height: row.decisionHeight ?? null,
          }
        : null,
    ),
    appealingQuestion: row.appealingQuestion,
    appealingAnswer: row.appealingAnswer,
    appealingSectionImageId: row.appealingSectionImage,
    appealingSectionImageMedia: mapMedia(
      row.appealingId
        ? {
            id: row.appealingId,
            provider: row.appealingProvider ?? "local",
            key: row.appealingKey ?? "",
            bucket: row.appealingBucket ?? null,
            url: row.appealingUrl ?? null,
            mimeType: row.appealingMimeType ?? null,
            size: row.appealingSize ?? null,
            width: row.appealingWidth ?? null,
            height: row.appealingHeight ?? null,
          }
        : null,
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getActiveMemberSections(): Promise<MemberSection[]> {
  await initCloudflareD1();
  const rows = await db.query<
    MemberSectionRow & {
      heroId: number | null;
      heroProvider: string | null;
      heroKey: string | null;
      heroBucket: string | null;
      heroUrl: string | null;
      heroMimeType: string | null;
      heroSize: number | null;
      heroWidth: number | null;
      heroHeight: number | null;
      joinedId: number | null;
      joinedProvider: string | null;
      joinedKey: string | null;
      joinedBucket: string | null;
      joinedUrl: string | null;
      joinedMimeType: string | null;
      joinedSize: number | null;
      joinedWidth: number | null;
      joinedHeight: number | null;
      decisionId: number | null;
      decisionProvider: string | null;
      decisionKey: string | null;
      decisionBucket: string | null;
      decisionUrl: string | null;
      decisionMimeType: string | null;
      decisionSize: number | null;
      decisionWidth: number | null;
      decisionHeight: number | null;
      appealingId: number | null;
      appealingProvider: string | null;
      appealingKey: string | null;
      appealingBucket: string | null;
      appealingUrl: string | null;
      appealingMimeType: string | null;
      appealingSize: number | null;
      appealingWidth: number | null;
      appealingHeight: number | null;
    }
  >(
    `SELECT ms.*,
            hero.id as heroId, hero.provider as heroProvider, hero.key as heroKey, hero.bucket as heroBucket, hero.url as heroUrl,
            hero.mimeType as heroMimeType, hero.size as heroSize, hero.width as heroWidth, hero.height as heroHeight,
            joined.id as joinedId, joined.provider as joinedProvider, joined.key as joinedKey, joined.bucket as joinedBucket, joined.url as joinedUrl,
            joined.mimeType as joinedMimeType, joined.size as joinedSize, joined.width as joinedWidth, joined.height as joinedHeight,
            decision.id as decisionId, decision.provider as decisionProvider, decision.key as decisionKey, decision.bucket as decisionBucket, decision.url as decisionUrl,
            decision.mimeType as decisionMimeType, decision.size as decisionSize, decision.width as decisionWidth, decision.height as decisionHeight,
            appealing.id as appealingId, appealing.provider as appealingProvider, appealing.key as appealingKey, appealing.bucket as appealingBucket, appealing.url as appealingUrl,
            appealing.mimeType as appealingMimeType, appealing.size as appealingSize, appealing.width as appealingWidth, appealing.height as appealingHeight
     FROM member_section ms
     LEFT JOIN media hero ON hero.id = ms.heroImage
     LEFT JOIN media joined ON joined.id = ms.joinedSectionImage
     LEFT JOIN media decision ON decision.id = ms.decisionSectionImage
     LEFT JOIN media appealing ON appealing.id = ms.appealingSectionImage
     WHERE ms.isActive = 1
     ORDER BY ms.updatedAt DESC`,
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    isActive: Boolean(row.isActive),
    name: row.name,
    subTitle: row.subTitle,
    title: row.title,
    joinDate: row.joinDate,
    department: row.department,
    description: row.description,
    heroImageId: row.heroImage,
    heroImageMedia: mapMedia(
      row.heroId
        ? {
            id: row.heroId,
            provider: row.heroProvider ?? "local",
            key: row.heroKey ?? "",
            bucket: row.heroBucket ?? null,
            url: row.heroUrl ?? null,
            mimeType: row.heroMimeType ?? null,
            size: row.heroSize ?? null,
            width: row.heroWidth ?? null,
            height: row.heroHeight ?? null,
          }
        : null,
    ),
    joinedInformationQuestion: row.joinedInformationQuestion,
    joinedInformationAnswer: row.joinedInformationAnswer,
    joinedSectionImageId: row.joinedSectionImage,
    joinedSectionImageMedia: mapMedia(
      row.joinedId
        ? {
            id: row.joinedId,
            provider: row.joinedProvider ?? "local",
            key: row.joinedKey ?? "",
            bucket: row.joinedBucket ?? null,
            url: row.joinedUrl ?? null,
            mimeType: row.joinedMimeType ?? null,
            size: row.joinedSize ?? null,
            width: row.joinedWidth ?? null,
            height: row.joinedHeight ?? null,
          }
        : null,
    ),
    decisionMakingQuestion: row.decisionMakingQuestion,
    decisionMakingAnswer: row.decisionMakingAnswer,
    decisionSectionImageId: row.decisionSectionImage,
    decisionSectionImageMedia: mapMedia(
      row.decisionId
        ? {
            id: row.decisionId,
            provider: row.decisionProvider ?? "local",
            key: row.decisionKey ?? "",
            bucket: row.decisionBucket ?? null,
            url: row.decisionUrl ?? null,
            mimeType: row.decisionMimeType ?? null,
            size: row.decisionSize ?? null,
            width: row.decisionWidth ?? null,
            height: row.decisionHeight ?? null,
          }
        : null,
    ),
    appealingQuestion: row.appealingQuestion,
    appealingAnswer: row.appealingAnswer,
    appealingSectionImageId: row.appealingSectionImage,
    appealingSectionImageMedia: mapMedia(
      row.appealingId
        ? {
            id: row.appealingId,
            provider: row.appealingProvider ?? "local",
            key: row.appealingKey ?? "",
            bucket: row.appealingBucket ?? null,
            url: row.appealingUrl ?? null,
            mimeType: row.appealingMimeType ?? null,
            size: row.appealingSize ?? null,
            width: row.appealingWidth ?? null,
            height: row.appealingHeight ?? null,
          }
        : null,
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function isMemberSectionSlugAvailable(
  slug: string,
  excludeId?: number | null,
) {
  await initCloudflareD1();
  const row = await db.queryOne<{ id: number }>(
    `SELECT id FROM member_section WHERE slug = ? LIMIT 1`,
    [slug],
  );
  if (!row) return true;
  if (excludeId && row.id === excludeId) return true;
  return false;
}

type UpsertMemberSectionInput = {
  slug: string;
  previousSlug?: string;
  isActive: boolean;
  name: string;
  subTitle?: string | null;
  title?: string | null;
  joinDate?: string | null;
  department?: string | null;
  description?: string | null;
  heroImageId?: number | null;
  joinedInformationQuestion?: string | null;
  joinedInformationAnswer?: string | null;
  joinedSectionImageId?: number | null;
  decisionMakingQuestion?: string | null;
  decisionMakingAnswer?: string | null;
  decisionSectionImageId?: number | null;
  appealingQuestion?: string | null;
  appealingAnswer?: string | null;
  appealingSectionImageId?: number | null;
};

export async function upsertMemberSection(
  input: UpsertMemberSectionInput,
): Promise<MemberSection> {
  await initCloudflareD1();
  const now = new Date().toISOString();
  return db.transaction(async (tx) => {
    const existing =
      (await tx.queryOne<{ id: number; slug: string }>(
        `SELECT id, slug FROM member_section WHERE slug = ? LIMIT 1`,
        [input.slug],
      )) ??
      (input.previousSlug
        ? await tx.queryOne<{ id: number; slug: string }>(
            `SELECT id, slug FROM member_section WHERE slug = ? LIMIT 1`,
            [input.previousSlug],
          )
        : null);

    let memberId = existing?.id ?? null;

    if (memberId) {
      if (existing?.slug && existing.slug !== input.slug) {
        await tx.execute(`UPDATE member_section SET slug = ? WHERE id = ?`, [
          input.slug,
          memberId,
        ]);
      }
      await tx.execute(
        `UPDATE member_section
         SET isActive = ?, name = ?, subTitle = ?, title = ?, joinDate = ?, department = ?, description = ?,
             heroImage = ?, joinedInformationQuestion = ?, joinedInformationAnswer = ?, joinedSectionImage = ?,
             decisionMakingQuestion = ?, decisionMakingAnswer = ?, decisionSectionImage = ?,
             appealingQuestion = ?, appealingAnswer = ?, appealingSectionImage = ?, updatedAt = ?
         WHERE id = ?`,
        [
          input.isActive ? 1 : 0,
          input.name,
          input.subTitle ?? null,
          input.title ?? null,
          input.joinDate ?? null,
          input.department ?? null,
          input.description ?? null,
          input.heroImageId ?? null,
          input.joinedInformationQuestion ?? null,
          input.joinedInformationAnswer ?? null,
          input.joinedSectionImageId ?? null,
          input.decisionMakingQuestion ?? null,
          input.decisionMakingAnswer ?? null,
          input.decisionSectionImageId ?? null,
          input.appealingQuestion ?? null,
          input.appealingAnswer ?? null,
          input.appealingSectionImageId ?? null,
          now,
          memberId,
        ],
      );
    } else {
      await tx.execute(
        `INSERT INTO member_section
         (slug, isActive, name, subTitle, title, joinDate, department, description, heroImage,
          joinedInformationQuestion, joinedInformationAnswer, joinedSectionImage,
          decisionMakingQuestion, decisionMakingAnswer, decisionSectionImage,
          appealingQuestion, appealingAnswer, appealingSectionImage, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.slug,
          input.isActive ? 1 : 0,
          input.name,
          input.subTitle ?? null,
          input.title ?? null,
          input.joinDate ?? null,
          input.department ?? null,
          input.description ?? null,
          input.heroImageId ?? null,
          input.joinedInformationQuestion ?? null,
          input.joinedInformationAnswer ?? null,
          input.joinedSectionImageId ?? null,
          input.decisionMakingQuestion ?? null,
          input.decisionMakingAnswer ?? null,
          input.decisionSectionImageId ?? null,
          input.appealingQuestion ?? null,
          input.appealingAnswer ?? null,
          input.appealingSectionImageId ?? null,
          now,
          now,
        ],
      );
      const created = await tx.queryOne<{ id: number }>(
        `SELECT id FROM member_section WHERE slug = ? LIMIT 1`,
        [input.slug],
      );
      memberId = created?.id ?? null;
    }

    if (!memberId) throw new Error("Failed to save member section.");

    const saved = await tx.queryOne<MemberSectionRow>(
      `SELECT * FROM member_section WHERE id = ? LIMIT 1`,
      [memberId],
    );
    if (!saved) throw new Error("Failed to load saved member section.");

    return {
      id: saved.id,
      slug: saved.slug,
      isActive: Boolean(saved.isActive),
      name: saved.name,
      subTitle: saved.subTitle,
      title: saved.title,
      joinDate: saved.joinDate,
      department: saved.department,
      description: saved.description,
      heroImageId: saved.heroImage,
      joinedInformationQuestion: saved.joinedInformationQuestion,
      joinedInformationAnswer: saved.joinedInformationAnswer,
      joinedSectionImageId: saved.joinedSectionImage,
      decisionMakingQuestion: saved.decisionMakingQuestion,
      decisionMakingAnswer: saved.decisionMakingAnswer,
      decisionSectionImageId: saved.decisionSectionImage,
      appealingQuestion: saved.appealingQuestion,
      appealingAnswer: saved.appealingAnswer,
      appealingSectionImageId: saved.appealingSectionImage,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  });
}

export async function updateMemberSectionActive(input: {
  id: number;
  isActive: boolean;
}) {
  await initCloudflareD1();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE member_section SET isActive = ?, updatedAt = ? WHERE id = ?`,
    [input.isActive ? 1 : 0, now, input.id],
  );
}

export async function deleteMemberSectionById(id: number) {
  await initCloudflareD1();
  await db.execute(`DELETE FROM member_section WHERE id = ?`, [id]);
}
