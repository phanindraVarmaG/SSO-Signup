import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { User } from '../entity/user.entity';

@Injectable()
export class MicrosoftService {
  private readonly logger = new Logger(MicrosoftService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('MicrosoftService initialized');
  }

  async validateMicrosoftUser(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    picture?: string;
    providerId: string;
  }): Promise<User> {
    try {
      this.logger.log(`Validating Microsoft user: ${profile.email}`);

      // Check if user already exists
      let user = this.usersRepository.findByEmailOrProviderId(
        profile.email,
        profile.providerId,
        'microsoft',
      );

      if (!user) {
        // Create new user from Microsoft profile
        user = this.usersRepository.create({
          email: profile.email,
          firstName: profile.firstName || profile.displayName?.split(' ')[0] || '',
          lastName:
            profile.lastName ||
            profile.displayName?.split(' ').slice(1).join(' ') ||
            '',
          displayName: profile.displayName,
          picture: profile.picture,
          provider: 'microsoft',
          providerId: profile.providerId,
          isAdmin: this.usersService.checkIfAdmin(profile.email),
        });

        this.logger.log(`New Microsoft user created: ${profile.email}`);
      } else {
        // Update existing user with latest profile info
        const updatedUser = this.usersRepository.update(user.id, {
          firstName: profile.firstName || profile.displayName?.split(' ')[0] || user.firstName,
          lastName:
            profile.lastName ||
            profile.displayName?.split(' ').slice(1).join(' ') ||
            user.lastName,
          displayName: profile.displayName || user.displayName,
          picture: profile.picture || user.picture,
        });

        this.logger.log(`Microsoft user updated: ${profile.email}`);
        user = updatedUser!;
      }

      return user;
    } catch (error: any) {
      this.logger.error(`Error validating Microsoft user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
