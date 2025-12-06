import { NextResponse } from "next/server";

import { getCacheHeaders } from "./cache-headers";

/**
 * Create an error response with consistent formatting
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown> | string
): NextResponse {
  const body: Record<string, unknown> = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  
  if (details !== undefined) {
    body.details = details;
  }
  
  return NextResponse.json(body, { status });
}

/**
 * Create a success response with consistent formatting
 */
export function successResponse<T>(
  data: T,
  cacheDuration?: number,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const headers: Record<string, string> = {
    ...additionalHeaders,
    ...(cacheDuration ? getCacheHeaders(cacheDuration) : {}),
  };

  return NextResponse.json(data, { headers });
}
