import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { Profile } from 'passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  private readonly logger = new Logger(MicrosoftStrategy.name);

  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('microsoft.clientID'),
      clientSecret: configService.get<string>('microsoft.clientSecret'),
      callbackURL: configService.get<string>('microsoft.callbackURL'),
      scope: ['openid', 'profile', 'email', 'User.Read'],
      tenant: 'common',
    });
    const tenantId = configService.get<string>('microsoft.tenantID');
    this.logger.log(`MicrosoftStrategy initialized with tenant: ${tenantId || 'common'}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    try {
      // Log the entire profile for debugging
      this.logger.debug(`Microsoft Profile received: ${JSON.stringify(profile, null, 2)}`);
      
      const { id, displayName, name, emails, photos, _json } = profile;

      // Try to extract email from multiple possible locations
      let email: string | undefined;
      
      // Check emails array first
      if (emails && emails.length > 0) {
        email = emails[0].value;
      }
      // Check _json.mail (primary email in Microsoft Graph)
      else if (_json?.mail) {
        email = _json.mail;
      }
      // Check _json.userPrincipalName (fallback, usually login name)
      else if (_json?.userPrincipalName) {
        email = _json.userPrincipalName;
      }
      // Check _json.email
      else if (_json?.email) {
        email = _json.email;
      }

      // Validate email exists
      if (!email) {
        this.logger.error(`No email found in Microsoft profile. Profile structure: ${JSON.stringify({ id, displayName, name, emails, _json }, null, 2)}`);
        return done(new Error('No email found in Microsoft profile'), null);
      }

      const user = {
        email,
        firstName: name?.givenName || _json?.givenName || displayName?.split(' ')[0] || '',
        lastName: name?.familyName || _json?.surname || displayName?.split(' ').slice(1).join(' ') || '',
        displayName: displayName || _json?.displayName,
        picture: photos && photos.length > 0 ? photos[0].value : undefined,
        accessToken,
        provider: 'microsoft',
        providerId: id,
        microsoftAccessToken: accessToken, // Duplicate for consistency with Google strategy
      };

      this.logger.log(`Microsoft OAuth validation successful for: ${user.email}`);
      done(null, user);
    } catch (error: any) {
      this.logger.error(`Microsoft OAuth validation failed: ${error.message}`, error.stack);
      done(error, null);
    }
  }
}
