import { z } from "zod";
import { db } from "@/lib/db";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { normalizeSlug } from "@/lib/utils/slug";
import { defaultLocale } from '@/utils/strings/config';
import {
  deletePostById,
  getAllPosts,
  getPostBySlugPreview,
  upsertCategory,
  deleteCategoryById,
  getAllCategories,
} from "@/lib/services/posts";
import { listUsers, updateUserStatus } from "@/lib/auth/users";
import { listContacts, deleteContactById } from "@/lib/services/contacts";
import { router, protectedProcedure, superuserProcedure } from "@/api/trpc/trpc";

export const appRouter = router({
  users: router({
    list: superuserProcedure.query(async () => {
      await initCloudflareD1();
      return listUsers();
    }),
    updateStatus: superuserProcedure
      .input(z.object({ id: z.number(), status: z.enum(["active", "pending", "rejected"]) }))
      .mutation(async ({ input }) => {
        await initCloudflareD1();
        return updateUserStatus(input.id, input.status);
      }),
  }),
  posts: router({
    list: protectedProcedure
      .input(z.object({ mine: z.boolean().optional(), locale: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const locale: typeof defaultLocale = defaultLocale;
        const posts = await getAllPosts(locale);
        if (input?.mine && ctx.user?.role === "author") {
          return posts.filter((post) => post.createdBy === ctx.user?.id);
        }
        return posts;
      }),
    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string(), locale: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const locale: typeof defaultLocale = defaultLocale;
        const post = await getPostBySlugPreview(input.slug, locale, { includeLocales: true });
        if (!post) return null;
        if (ctx.user?.role === "author" && post.createdBy !== ctx.user.id) {
          return null;
        }
        return post;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await initCloudflareD1();
        const post = await db.queryOne<{ id: number; createdBy: number | null }>(
          `SELECT id, createdBy FROM posts WHERE id = ?`,
          [input.id],
        );
        if (!post) return null;
        if (ctx.user?.role === "author" && post.createdBy !== ctx.user.id) {
          return null;
        }
        await deletePostById(input.id);
        return { id: input.id };
      }),
  }),
  categories: router({
    list: protectedProcedure.query(async () => {
      await initCloudflareD1();
      return getAllCategories();
    }),
    upsert: superuserProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
          intro: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await initCloudflareD1();
        const slug = normalizeSlug(input.slug);
        if (!slug) return null;
        await upsertCategory({
          slug,
          name: input.name,
          intro: input.intro ?? null,
          actorId: ctx.user?.id ?? null,
        });
        return db.queryOne<{
          id: number;
          slug: string;
          name: string;
          intro: string | null;
        }>(`SELECT id, slug, name, intro FROM categories WHERE slug = ?`, [slug]);
      }),
    delete: superuserProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await initCloudflareD1();
        await deleteCategoryById(input.id);
        return { id: input.id };
      }),
  }),
  contacts: router({
    list: superuserProcedure.query(async () => {
      await initCloudflareD1();
      return listContacts();
    }),
    delete: superuserProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await initCloudflareD1();
        await deleteContactById(input.id);
        return { id: input.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
