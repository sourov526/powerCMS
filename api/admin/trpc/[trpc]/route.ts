export const runtime = "nodejs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/api/routers";
import { createContext } from "@/api/trpc/context";

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
