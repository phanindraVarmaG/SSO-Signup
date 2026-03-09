import { Injectable, Logger } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  // Temporary in-memory user store (replace with DB later)
  private users: User[] = [];

  constructor() {
    this.logger.log('UsersRepository initialized');
  }

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username);
  }

  findByProviderId(providerId: string, provider: string): User | undefined {
    return this.users.find(
      (u) => u.providerId === providerId && u.provider === provider,
    );
  }

  findByEmailOrProviderId(email: string, providerId: string, provider: string): User | undefined {
    return this.users.find(
      (u) =>
        u.email === email ||
        (u.providerId === providerId && u.provider === provider),
    );
  }

  findByEmailUsernameOrProviderId(
    email: string,
    username: string,
    providerId: string,
    provider: string,
  ): User | undefined {
    return this.users.find(
      (u) =>
        u.email === email ||
        u.username === username ||
        (u.providerId === providerId && u.provider === provider),
    );
  }

  create(userData: Partial<User>): User {
    const user: User = {
      id: randomUUID(),
      createdAt: new Date(),
      isActive: true,
      ...userData,
    } as User;

    this.users.push(user);
    this.logger.log(`User created: ${user.email || user.username}`);
    return user;
  }

  update(id: string, userData: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return undefined;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
    };

    this.logger.log(`User updated: ${this.users[userIndex].email || this.users[userIndex].username}`);
    return this.users[userIndex];
  }

  delete(id: string): boolean {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    this.logger.log(`User deleted: ${id}`);
    return true;
  }
}
