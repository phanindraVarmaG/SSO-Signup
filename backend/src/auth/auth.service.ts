import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { User } from "../users/user.entity";

@Injectable()
export class AuthService {
  // Temporary in-memory user store (replace with DB later)
  private users: User[] = [];

  constructor(private jwtService: JwtService) {}

  async register(email: string, password: string) {
    // Check if user already exists
    const existingUser = this.users.find((u) => u.email === email);
    if (existingUser) {
      throw new UnauthorizedException("User already exists");
    }

    const hash = await bcrypt.hash(password, 10);

    const user: User = {
      id: randomUUID(),
      email,
      passwordHash: hash,
      provider: "local",
      isActive: true,
      createdAt: new Date(),
    };

    this.users.push(user);

    return { id: user.id, email: user.email };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = this.users.find((u) => u.email === email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException("Invalid credentials");

    return user;
  }

  async validateOAuthUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    // Check if user already exists by email or providerId
    let user = this.users.find(
      (u) =>
        u.email === profile.email ||
        (u.providerId === profile.providerId &&
          u.provider === profile.provider),
    );

    if (!user) {
      // Create new user from OAuth profile
      user = {
        id: randomUUID(),
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        picture: profile.picture,
        provider: profile.provider as "local" | "google",
        providerId: profile.providerId,
        isActive: true,
        createdAt: new Date(),
      };
      this.users.push(user);
    } else {
      // Update existing user with latest OAuth info
      user.firstName = profile.firstName;
      user.lastName = profile.lastName;
      user.picture = profile.picture;
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        provider: user.provider,
      },
    };
  }
}
