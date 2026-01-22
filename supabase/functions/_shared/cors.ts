/**
 * CORS and Security Headers Configuration
 * Allows all origins for development/preview, restricts in production
 */

const getAllowedOrigins = (): string[] => {
  const env = Deno.env.get("ENVIRONMENT") || "development";
  const siteUrl = Deno.env.get("SITE_URL");
  
  if (env === "production" && siteUrl) {
    return [siteUrl];
  }
  
  // In development, allow common origins
  return [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
  ];
};

export const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const env = Deno.env.get("ENVIRONMENT") || "development";
  const allowedOrigins = getAllowedOrigins();
  
  // In development, allow all origins (including Lovable preview)
  // In production, only allow configured origins
  let allowedOrigin: string;
  
  if (env !== "production") {
    // Allow any origin in development
    allowedOrigin = origin || "*";
  } else {
    const isAllowed = origin && allowedOrigins.includes(origin);
    allowedOrigin = isAllowed ? origin : allowedOrigins[0];
  }
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
    headers: getCorsHeaders(origin),
  });
};
