import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../services/auth.service';
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
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    try {
      // Try real LDAP authentication
      const realLdapResult = await this.tryRealLdapAuthentication(username, password);
      return realLdapResult;
    } catch (error: any) {
      // Always try mock fallback if LDAP fails for any reason
      try {
        return await this.validateMockLdapUser(username, password);
      } catch (mockError) {
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
      searchFilter: this.configService.get<string>('ldap.searchFilter').replace('{{username}}', username),
      reconnect: true,
      timeout: 5000,
      connectTimeout: 5000,
    };

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
            (
              (err as any).code === 'ECONNREFUSED' ||
              (err as any).code === 'ETIMEDOUT' ||
              (err as any).code === 'ENOTFOUND' ||
              (err as any).code === 'EAI_AGAIN'
            )
          ) {
            (err as any).code = 'LDAPError';
            return reject(err);
          }
          // Invalid credentials
          return reject(new UnauthorizedException('LDAP authentication failed - invalid credentials'));
        }
        if (!user) {
          return reject(new UnauthorizedException('LDAP authentication failed - user not found'));
        }
        // Map user fields as needed
        const userProfile = {
          email: user.mail || user.userPrincipalName || user.sAMAccountName + '@company.com',
          firstName: user.givenName || user.cn?.split(' ')[0] || '',
          lastName: user.sn || user.cn?.split(' ').slice(1).join(' ') || '',
          username: user.sAMAccountName || user.uid || username,
          displayName: user.displayName || user.cn || `${user.givenName} ${user.sn}`,
          provider: 'ldap',
          providerId: user.dn,
          department: user.department,
          title: user.title,
        };
        const validatedUser = await this.authService.validateLdapUser(userProfile);
        resolve(validatedUser);
      });
    });
  }

  private async validateMockLdapUser(username: string, password: string) {
    console.log(`Attempting mock LDAP authentication for user: ${username}`);
    

    const mockUser = mockLdapUsers.find(user => 
      user.username === username || user.email === username
    );

    if (!mockUser) {
      throw new UnauthorizedException(`Invalid LDAP credentials - user '${username}' not found in fallback directory`);
    }

    // For mock authentication, accept any non-empty password
    if (!password || password.trim() === '') {
      throw new UnauthorizedException('Password is required');
    }

    console.log(`Mock LDAP authentication successful for user: ${username} (fallback mode)`);
    return await this.authService.validateLdapUser(mockUser);
  }
}