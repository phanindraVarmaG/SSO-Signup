import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../entity/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('AuthService initialized');
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    try {
      this.logger.log(`Registering new user: ${email}`);

      const user = await this.usersService.createLocalUser(
        email,
        password,
        firstName,
        lastName,
      );

      this.logger.log(`User registered successfully: ${email}`);
      return { id: user.id, email: user.email };
    } catch (error) {
      this.logger.error(`Registration error for ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    return this.usersService.validateLocalUser(email, password);
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
}
