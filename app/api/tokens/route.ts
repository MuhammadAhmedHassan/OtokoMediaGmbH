import { NextRequest, NextResponse } from "next/server";
import {
  createToken,
  listActiveTokensForUser,
  serializeToken,
  type CreateTokenRequest,
} from "@/lib/tokens";

export const runtime = "nodejs";

type ParsedBodyResult =
  | { value: CreateTokenRequest; error?: undefined }
  | { value?: undefined; error: string };

function parseCreateTokenBody(body: unknown): ParsedBodyResult {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be a JSON object." };
  }

  const { userId, scopes, expiresInMinutes } = body as Record<string, unknown>;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    return { error: "userId must be a non-empty string." };
  }

  if (!Array.isArray(scopes) || scopes.length === 0) {
    return { error: "scopes must be a non-empty array of strings." };
  }

  const normalizedScopes = scopes.map((s) => (typeof s === "string" ? s.trim() : s));
  if (!normalizedScopes.every((s) => typeof s === "string" && s.length > 0)) {
    return { error: "scopes must be a non-empty array of non-empty strings." };
  }

  if (typeof expiresInMinutes !== "number" || !Number.isInteger(expiresInMinutes) || expiresInMinutes <= 0) {
    return { error: "expiresInMinutes must be a positive integer." };
  }

  const value: CreateTokenRequest = {
    userId: userId.trim(),
    scopes: normalizedScopes as string[],
    expiresInMinutes,
  };

  return { value };
}

export async function POST(request: NextRequest) {
  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseCreateTokenBody(jsonBody);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = createToken(parsed.value);

  return NextResponse.json(serializeToken(token), { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'userId' is required and must be a non-empty string." },
      { status: 400 },
    );
  }

  const tokens = listActiveTokensForUser(userId.trim());

  return NextResponse.json(tokens.map(serializeToken), { status: 200 });
}


