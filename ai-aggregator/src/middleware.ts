import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect the chat page (and API) — allow public access to landing/pricing
const isProtectedRoute = createRouteMatcher(["/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // For now, allow all routes (we'll add credit checks in the API route)
  // Uncomment below to require login for chat:
  // if (isProtectedRoute(request)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};