export class User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  passwordHash?: string; // Optional now (OAuth users don't have passwords)
  provider: "local" | "google"; // Authentication provider
  providerId?: string; // ID from OAuth provider
  isActive: boolean;
  createdAt: Date;
}
