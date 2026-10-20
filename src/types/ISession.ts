/**
 * Session cookie yükü — `app/lib/session.ts` ile aynı şekil.
 * Client tarafında da kullanılabilmesi için "server-only" modülünden ayrı tutulur.
 */
export interface ISessionPayload {
  data: {
    id: number;
    token: boolean;
  };
  expiresAt: string;
}
