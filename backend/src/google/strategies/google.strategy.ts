import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientID'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackURL'),
      scope: ['email', 'profile'],
    });
    this.logger.log('GoogleStrategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;

      if (!emails || emails.length === 0) {
        this.logger.error('No email found in Google profile');
        return done(new Error('No email found in Google profile'), null);
      }

      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos && photos.length > 0 ? photos[0].value : undefined,
        accessToken,
        provider: 'google',
        providerId: profile.id,
        googleAccessToken: accessToken,
      };

      this.logger.log(`Google OAuth validation successful for: ${user.email}`);
      done(null, user);
    } catch (error: any) {
      this.logger.error(`Google OAuth validation failed: ${error.message}`, error.stack);
      done(error, null);
    }
  }
}
