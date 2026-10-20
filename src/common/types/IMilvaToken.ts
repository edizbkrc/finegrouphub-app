export interface IMilvaToken {
  accessToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
  refreshToken: string;
  tokenType: string;
  sessionState: string | null;
  scope: string;
}
