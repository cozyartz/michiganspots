// Authentication library using OAuth providers (GitHub, Google)
import { GitHub, Google } from 'arctic';

// Generate random session ID
export function generateSessionId(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate random state for OAuth
export function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Initialize GitHub OAuth client
export function createGitHubClient(clientId: string, clientSecret: string, redirectUri: string) {
  return new GitHub(clientId, clientSecret, redirectUri);
}

// Initialize Google OAuth client
export function createGoogleClient(clientId: string, clientSecret: string, redirectUri: string) {
  return new Google(clientId, clientSecret, redirectUri);
}

// User roles
export type UserRole = 'user' | 'partner' | 'super_admin';

// User interface (matching D1 schema)
export interface User {
  id: number;
  github_id: number | null;
  username: string | null;
  email: string;
  name: string;
  city: string;
  reddit_username: string | null;
  avatar_url: string | null;
  role: UserRole;
  total_spots: number;
  total_badges: number;
  team_id: number | null;
  created_at: string;
  updated_at: string;
}

// Session interface
export interface Session {
  id: string;
  user_id: number;
  expires_at: number;
  created_at: number;
}

// Session with user data
export interface SessionWithUser {
  session: Session;
  user: User;
}

// Session duration (30 days)
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

// Create a new session
export function createSession(userId: number): { id: string; expiresAt: number } {
  const sessionId = generateSessionId();
  const expiresAt = Date.now() + SESSION_DURATION;

  return {
    id: sessionId,
    expiresAt,
  };
}

// Parse session cookie
export function parseSessionCookie(cookie: string | null): string | null {
  if (!cookie) return null;

  const cookies = cookie.split(';');
  for (const c of cookies) {
    const [name, value] = c.trim().split('=');
    if (name === 'session_id') {
      return value;
    }
  }

  return null;
}

// Create session cookie
export function createSessionCookie(sessionId: string, expiresAt: number): string {
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);

  return [
    `session_id=${sessionId}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');
}

// Create logout cookie
export function createLogoutCookie(): string {
  return [
    'session_id=',
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');
}

// Check if user has required role
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    partner: 2,
    super_admin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

// Your GitHub username for super admin seeding
export const SUPER_ADMIN_GITHUB_USERNAME = 'cozart-lundin'; // Replace with your actual GitHub username
