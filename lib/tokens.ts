import { randomBytes, randomUUID } from "crypto";

export interface CreateTokenRequest {
  userId: string;
  scopes: string[];
  expiresInMinutes: number;
}

export interface Token {
  id: string;
  userId: string;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date;
  token: string;
}

export interface TokenResponse {
  id: string;
  userId: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  token: string;
}

const tokenStore: Token[] = [];

export function isTokenExpired(token: Pick<Token, "expiresAt">, now: Date = new Date()): boolean {
  return token.expiresAt.getTime() <= now.getTime();
}

export function createToken(input: CreateTokenRequest, now: Date = new Date()): Token {
  const id = `token_${randomUUID()}`;
  const createdAt = now;
  const expiresAt = new Date(now.getTime() + input.expiresInMinutes * 60 * 1000);
  const token = randomBytes(24).toString("hex");

  const record: Token = {
    id,
    userId: input.userId,
    scopes: input.scopes,
    createdAt,
    expiresAt,
    token,
  };

  tokenStore.push(record);

  return record;
}

export function listActiveTokensForUser(userId: string, now: Date = new Date()): Token[] {
  return tokenStore.filter((t) => t.userId === userId && !isTokenExpired(t, now));
}

export function serializeToken(token: Token): TokenResponse {
  return {
    id: token.id,
    userId: token.userId,
    scopes: token.scopes,
    createdAt: token.createdAt.toISOString(),
    expiresAt: token.expiresAt.toISOString(),
    token: token.token,
  };
}


