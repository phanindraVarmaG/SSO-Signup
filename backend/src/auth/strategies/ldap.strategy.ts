import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { mockLdapUsers } from '../mock-ldap-users';

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
      // First, try real LDAP authentication
      const realLdapResult = await this.tryRealLdapAuthentication(username, password);
      if (realLdapResult) {
        return realLdapResult;
      }
    } catch (error) {
      console.log('Real LDAP authentication failed, trying fallback:', error.message);
    }

    // Fallback to mock LDAP authentication
    return this.validateMockLdapUser(username, password);
  }

  private async tryRealLdapAuthentication(username: string, password: string): Promise<any> {
    if (!LdapAuthStrategy_Real) {
      throw new Error('passport-ldapauth not available');
    }

    return new Promise((resolve, reject) => {
      const ldapConfig = {
        server: {
          url: this.configService.get<string>('ldap.url'),
          bindDN: this.configService.get<string>('ldap.bindDN'),
          bindCredentials: this.configService.get<string>('ldap.bindCredentials'),
          searchBase: this.configService.get<string>('ldap.searchBase'),
          searchFilter: this.configService.get<string>('ldap.searchFilter'),
          reconnect: true,
          connectTimeout: 5000,
          timeout: 5000,
        },
      };

      // Create LDAP strategy instance
      const ldapStrategy = new LdapAuthStrategy_Real(ldapConfig, async (profile: any) => {
        try {
          const userProfile = {
            email: profile.mail || profile.userPrincipalName || profile.sAMAccountName + '@company.com',
            firstName: profile.givenName || profile.cn?.split(' ')[0] || '',
            lastName: profile.sn || profile.cn?.split(' ').slice(1).join(' ') || '',
            username: profile.sAMAccountName || profile.uid || username,
            displayName: profile.displayName || profile.cn || `${profile.givenName} ${profile.sn}`,
            provider: 'ldap',
            providerId: profile.dn,
            department: profile.department,
            title: profile.title,
          };

          const validatedUser = await this.authService.validateLdapUser(userProfile);
          console.log(`Real LDAP authentication successful for user: ${username}`);
          resolve(validatedUser);
        } catch (error) {
          reject(error);
        }
      });

      // Authenticate with LDAP
      ldapStrategy.authenticate({ username, password }, {}, (err: any, user: any) => {
        if (err) {
          reject(new Error(`LDAP authentication error: ${err.message}`));
        } else if (!user) {
          reject(new Error('LDAP authentication failed - invalid credentials'));
        } else {
          resolve(user);
        }
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