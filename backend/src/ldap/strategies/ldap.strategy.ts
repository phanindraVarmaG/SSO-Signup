import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { ConfigService } from '@nestjs/config';
import { LdapService } from '../ldap.service';
import { mockLdapUsers } from '../../users/mock-ldap-users';
const LdapAuth = require('ldapauth-fork');

// Try to import LDAP strategy, fall back to local if not available
let LdapAuthStrategy_Real;
try {
  LdapAuthStrategy_Real = require('passport-ldapauth');
} catch (error) {
  console.warn('passport-ldapauth not available, using mock LDAP authentication');
}

@Injectable()
export class LdapAuthStrategy extends PassportStrategy(LocalStrategy, 'ldap') {
  private readonly logger = new Logger(LdapAuthStrategy.name);

  constructor(
    private configService: ConfigService,
    private ldapService: LdapService,
  )  {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
    this.logger.log('LdapAuthStrategy initialized');
  }

  async validate(username: string, password: string): Promise<any> {
    try {
      this.logger.log(`LDAP authentication attempt for username: ${username}`);
      // Try real LDAP authentication
      const realLdapResult = await this.tryRealLdapAuthentication(username, password);
      return realLdapResult;
    } catch (error: any) {
      this.logger.warn(`Real LDAP authentication failed for ${username}: ${error.message}`);
      // Always try mock fallback if LDAP fails for any reason
      try {
        this.logger.log(`Attempting mock LDAP authentication for: ${username}`);
        return await this.validateMockLdapUser(username, password);
      } catch (mockError) {
        this.logger.error(`Mock LDAP authentication also failed for ${username}`);
        // If not found in mock, throw original LDAP error
        throw new UnauthorizedException(error.message || 'LDAP authentication failed');
      }
    }
  }

  private async tryRealLdapAuthentication(username: string, password: string): Promise<any> {
    const options = {
      url: this.configService.get<string>('ldap.url'),
      bindDN: this.configService.get<string>('ldap.bindDN'),
      bindCredentials: this.configService.get<string>('ldap.bindCredentials'),
      searchBase: this.configService.get<string>('ldap.searchBase'),
      searchFilter: this.configService
        .get<string>('ldap.searchFilter')
        .replace('{{username}}', username),
      reconnect: true,
      timeout: 5000,
      connectTimeout: 5000,
    };

    this.logger.debug(`LDAP connection config: URL=${options.url}, Base=${options.searchBase}`);

    return new Promise((resolve, reject) => {
      const ldap = new LdapAuth(options);
      ldap.authenticate(username, password, async (err, user) => {
        ldap.close();
        if (err) {
          // Connection errors
          if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            ((err as any).code === 'ECONNREFUSED' ||
              (err as any).code === 'ETIMEDOUT' ||
              (err as any).code === 'ENOTFOUND' ||
              (err as any).code === 'EAI_AGAIN')
          ) {
            this.logger.error(`LDAP connection error: ${(err as any).code}`);
            (err as any).code = 'LDAPError';
            return reject(err);
          }
          // Invalid credentials
          this.logger.warn(`LDAP authentication failed for ${username}: Invalid credentials`);
          return reject(
            new UnauthorizedException('LDAP authentication failed - invalid credentials'),
          );
        }
        if (!user) {
          this.logger.warn(`LDAP user not found: ${username}`);
          return reject(new UnauthorizedException('LDAP authentication failed - user not found'));
        }

        // Map user fields as needed
        const userProfile = {
          email: user.mail || user.userPrincipalName || user.sAMAccountName + '@company.com',
          firstName: user.givenName || user.cn?.split(' ')[0] || '',
          lastName: user.sn || user.cn?.split(' ').slice(1).join(' ') || '',
          username: user.sAMAccountName || user.uid || username,
          displayName: user.displayName || user.cn || `${user.givenName} ${user.sn}`,
          providerId: user.dn,
          department: user.department,
          title: user.title,
        };

        this.logger.log(`LDAP authentication successful for: ${username}`);
        const validatedUser = await this.ldapService.validateLdapUser(userProfile);
        resolve(validatedUser);
      });
    });
  }

  private async validateMockLdapUser(username: string, password: string) {
    this.logger.log(`Attempting mock LDAP authentication for user: ${username}`);

    const mockUser = mockLdapUsers.find(
      (user) => user.username === username || user.email === username,
    );

    if (!mockUser) {
      this.logger.warn(`Mock LDAP user not found: ${username}`);
      throw new UnauthorizedException(
        `Invalid LDAP credentials - user '${username}' not found in fallback directory`,
      );
    }

    // For mock authentication, accept any non-empty password
    if (!password || password.trim() === '') {
      this.logger.error('Empty password provided for mock LDAP authentication');
      throw new UnauthorizedException('Password is required');
    }

    this.logger.log(`Mock LDAP authentication successful for user: ${username} (fallback mode)`);
    return await this.ldapService.validateLdapUser(mockUser);
  }
}
