export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string; // Added for LDAP
  displayName?: string; // Added for LDAP
  picture?: string;
  passwordHash?: string; // Only for local users
  provider: "local" | "google" | "ldap"; // Added LDAP provider
  providerId?: string;
  department?: string; // Added for LDAP
  title?: string; // Added for LDAP
  isActive: boolean;
  createdAt: Date;
}