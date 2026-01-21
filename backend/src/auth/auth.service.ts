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

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
