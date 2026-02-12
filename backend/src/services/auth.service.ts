import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { User } from "../users/user.entity";
import * as ldap from 'ldapjs';
import { LdapRegisterDto } from '../auth/dto/ldap-register.dto';

// This file is being moved to services/auth.service.ts

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
      isAdmin: this.checkIfAdmin(email),
      isActive: true,
      createdAt: new Date(),
    };

    this.users.push(user);
    return { id: user.id, email: user.email };
  }

  // Helper method to check if user is admin
  private checkIfAdmin(emailOrUsername: string): boolean {
    return emailOrUsername === 'giresh@divami.com';
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
        provider: profile.provider as "local" | "google" | "ldap",
        providerId: profile.providerId,
        isAdmin: this.checkIfAdmin(profile.email),
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

  // 🆕 New method for LDAP user validation
  async validateLdapUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    displayName: string;
    provider: string;
    providerId: string;
    department?: string;
    title?: string;
  }): Promise<User> {
    // Check if user exists by email, username, or providerId
    let user = this.users.find(
      (u) =>
        u.email === profile.email ||
        u.username === profile.username ||
        (u.providerId === profile.providerId && u.provider === profile.provider),
    );

    if (!user) {
      // Create new user from LDAP profile
      user = {
        id: randomUUID(),
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        displayName: profile.displayName,
        provider: profile.provider as "local" | "google" | "ldap",
        providerId: profile.providerId,
        department: profile.department,
        title: profile.title,
        isAdmin: this.checkIfAdmin(profile.email) || this.checkIfAdmin(profile.username),
        isActive: true,
        createdAt: new Date(),
      };
      this.users.push(user);
    } else {
      // Update existing user with latest LDAP info
      user.firstName = profile.firstName;
      user.lastName = profile.lastName;
      user.displayName = profile.displayName;
      user.department = profile.department;
      user.title = profile.title;
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin || false,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        displayName: user.displayName,
        picture: user.picture,
        provider: user.provider,
        department: user.department,
        title: user.title,
        isAdmin: user.isAdmin || false,
      },
    };
  }

  async ldapRegister(dto: LdapRegisterDto) {
    // Connect to LDAP server
    const client = ldap.createClient({
      url: process.env.LDAP_URL || 'ldap://localhost:389',
      timeout: 5000,
      connectTimeout: 5000,
    });
    const adminDN = process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=org';
    const adminPass = process.env.LDAP_BIND_CREDENTIALS || 'admin';
    const baseDN = process.env.LDAP_SEARCH_BASE || 'dc=example,dc=org';
    // Hash password using slappasswd-compatible SSHA
    const crypto = require('crypto');
    function ssha(password: string) {
      const salt = crypto.randomBytes(4);
      const hash = crypto.createHash('sha1');
      hash.update(Buffer.from(password));
      hash.update(salt);
      const digest = Buffer.concat([hash.digest(), salt]);
      return '{SSHA}' + digest.toString('base64');
    }
    const userDN = `uid=${dto.username},${baseDN}`;
    const entry = {
      objectClass: ['inetOrgPerson'],
      uid: dto.username,
      sn: dto.sn,
      cn: dto.cn,
      userPassword: ssha(dto.password),
    };
    return new Promise((resolve, reject) => {
      client.bind(adminDN, adminPass, (err) => {
        if (err) return reject({ message: 'LDAP admin bind failed', error: err.message });
        client.add(userDN, entry, (err2) => {
          client.unbind();
          if (err2) return reject({ message: 'LDAP add failed', error: err2.message });
          resolve({ message: 'LDAP user registered', dn: userDN });
        });
      });
    });
  }
}