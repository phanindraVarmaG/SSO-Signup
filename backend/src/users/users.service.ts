import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from '../entity/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {
    this.logger.log('UsersService initialized');
  }

  // Helper method to check if user is admin
  checkIfAdmin(emailOrUsername: string): boolean {
    return emailOrUsername === 'giresh@divami.com';
  }

  async createLocalUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    try {
      this.logger.log(`Creating local user: ${email}`);

      // Check if user already exists
      const existingUser = this.usersRepository.findByEmail(email);
      if (existingUser) {
        this.logger.warn(`User already exists: ${email}`);
        throw new BadRequestException('User already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = this.usersRepository.create({
        email,
        passwordHash,
        firstName,
        lastName,
        provider: 'local',
        isAdmin: this.checkIfAdmin(email),
      });

      this.logger.log(`Local user created successfully: ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error creating local user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateLocalUser(email: string, password: string): Promise<User> {
    try {
      this.logger.log(`Validating local user: ${email}`);

      const user = this.usersRepository.findByEmail(email);
      if (!user || !user.passwordHash) {
        this.logger.warn(`User not found or invalid: ${email}`);
        throw new BadRequestException('Invalid credentials');
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        this.logger.warn(`Password mismatch for: ${email}`);
        throw new BadRequestException('Invalid credentials');
      }

      this.logger.log(`User validated successfully: ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  findById(id: string): User {
    const user = this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.usersRepository.findByEmail(email);
  }

  findAll(): User[] {
    return this.usersRepository.findAll();
  }

  updateUser(id: string, userData: Partial<User>): User {
    const user = this.usersRepository.update(id, userData);
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    return user;
  }

  deleteUser(id: string): boolean {
    const deleted = this.usersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    return true;
  }
}
