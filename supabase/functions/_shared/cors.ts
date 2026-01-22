/**
 * CORS and Security Headers Configuration
 * Implements restrictive CORS policy and security headers
 */

const getAllowedOrigins = (): string[] => {
  const env = Deno.env.get("ENVIRONMENT") || "development";
  if (env === "production") {
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) {
      console.error("SITE_URL not configured for production! Using development fallback.");
      return ["http://localhost:5173"];
    }
    return [siteUrl];
  }
  return ["http://localhost:5173", "http://localhost:3000"];
};

export const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    // Security headers
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Type": "application/json",
  };
};

export const handleCorsPreFlight = (origin: string | null): Response => {
  return new Response(null, { 
    status: 204,
    headers: getCorsHeaders(origin) 
  });
};
