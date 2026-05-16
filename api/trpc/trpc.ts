import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "@/api/trpc/context";

const t = initTRPC.context<Context>().create();

const requireUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireSuperuser = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "superuser") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireUser);
export const superuserProcedure = t.procedure.use(requireSuperuser);
