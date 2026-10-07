import 'express-session';

declare module 'express-session' {
  interface SessionData {
    tempUserId?: number;
    tempUsername?: string;
  }
}
