import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/routers/_app";
import { createContext } from "@/trpc/init";
import { validateSameOriginRequest } from "@/server/security/same-origin";

const handler = (req: Request) => {
  const sameOriginError = validateSameOriginRequest(req);
  if (sameOriginError) {
    return sameOriginError;
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
};

export { handler as GET, handler as POST };
