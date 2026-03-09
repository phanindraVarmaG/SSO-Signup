import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { User } from '../entity/user.entity';
import * as ldap from 'ldapjs';
import { LdapRegisterDto } from '../auth/dto/ldap-register.dto';

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('LdapService initialized');
  }

  async validateLdapUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    displayName: string;
    providerId: string;
    department?: string;
    title?: string;
  }): Promise<User> {
    try {
      this.logger.log(`Validating LDAP user: ${profile.username}`);

      // Check if user exists by email, username, or providerId
      let user = this.usersRepository.findByEmailUsernameOrProviderId(
        profile.email,
        profile.username,
        profile.providerId,
        'ldap',
      );

      if (!user) {
        // Create new user from LDAP profile
        user = this.usersRepository.create({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          displayName: profile.displayName,
          provider: 'ldap',
          providerId: profile.providerId,
          department: profile.department,
          title: profile.title,
          isAdmin:
            this.usersService.checkIfAdmin(profile.email) ||
            this.usersService.checkIfAdmin(profile.username),
        });

        this.logger.log(`New LDAP user created: ${profile.username}`);
      } else {
        // Update existing user with latest LDAP info
        const updatedUser = this.usersRepository.update(user.id, {
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName,
          department: profile.department,
          title: profile.title,
        });

        this.logger.log(`LDAP user updated: ${profile.username}`);
        user = updatedUser!;
      }

      return user;
    } catch (error: any) {
      this.logger.error(`Error validating LDAP user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async ldapRegister(dto: LdapRegisterDto) {
    this.logger.log(`Starting LDAP registration for user: ${dto.username}`);

    // Create user in AWS Directory Service using admin credentials
    const ldapUrl = process.env.LDAP_URL || 'ldap://localhost:389';
    const adminDN =
      process.env.LDAP_BIND_DN ||
      'CN=Admin,OU=Users,OU=corp,DC=corp,DC=example,DC=local';
    const adminPassword = process.env.LDAP_BIND_CREDENTIALS || 'admin';
    const baseDN = process.env.LDAP_SEARCH_BASE || 'dc=example,dc=org';

    this.logger.debug(`LDAP Configuration: URL=${ldapUrl}, BaseDN=${baseDN}, AdminDN=${adminDN}`);

    // CRITICAL: AWS Managed AD requires LDAPS to set passwords
    if (!ldapUrl.startsWith('ldaps://')) {
      this.logger.error(`LDAP URL must use LDAPS (ldaps://hostname:636) to create users with passwords. Current: ${ldapUrl}`);
      throw new BadRequestException(
        'LDAPS (secure LDAP on port 636) is required to create users in AWS Directory Service. Update LDAP_URL to use ldaps://corp.example.local:636',
      );
    }

    const client = ldap.createClient({
      url: ldapUrl,
      timeout: 10000,
      connectTimeout: 10000,
      tlsOptions: {
        rejectUnauthorized: false, // Set to true in production with proper certificates
      },
    });

    // Handle client errors
    client.on('error', (err) => {
      this.logger.error(`LDAP client error: ${err.message}`);
    });

    // For AWS Managed AD, users are typically created under CN=Users
    const userDN = `CN=${dto.cn},CN=Users,${baseDN}`;

    this.logger.debug(`Creating user with DN: ${userDN}`);

    // Create user entry for Microsoft Active Directory
    const entry: any = {
      objectClass: ['top', 'person', 'organizationalPerson', 'user'],
      cn: dto.cn,
      sn: dto.sn,
      givenName: dto.cn.split(' ')[0] || dto.username,
      displayName: dto.cn,
      sAMAccountName: dto.username,
      userPrincipalName: `${dto.username}@${baseDN.split(',').map((dc) => dc.replace('DC=', '')).join('.')}`,
      unicodePwd: this.encodePasswordForAD(dto.password),
      userAccountControl: '512', // Normal account, enabled
    };

    return new Promise((resolve, reject) => {
      // Bind as admin to create the user
      this.logger.log(`Attempting LDAP admin bind for user creation: ${dto.username}`);

      client.bind(adminDN, adminPassword, (bindErr: any) => {
        if (bindErr) {
          client.unbind();
          this.logger.error(`LDAP admin bind failed for ${dto.username}:`, {
            message: bindErr.message,
            code: bindErr.code,
            name: bindErr.name,
          });
          return reject(
            new UnauthorizedException(
              `LDAP admin authentication failed: ${bindErr.message} (Error code: ${bindErr.code || 'N/A'})`,
            ),
          );
        }

        this.logger.log(`LDAP admin bind successful, creating user: ${dto.username}`);

        // Add the new user
        client.add(userDN, entry, (addErr: any) => {
          if (addErr) {
            client.unbind();

            // Log comprehensive error details
            this.logger.error(`LDAP add user failed for ${dto.username}:`, {
              message: addErr.message,
              code: addErr.code,
              name: addErr.name,
              dn: userDN,
            });

            // Handle specific LDAP error codes
            let errorMessage = 'Failed to create user in AWS Directory Service';

            if (addErr.code === 68 || addErr.message?.includes('Already Exists')) {
              errorMessage = `User '${dto.username}' already exists in the directory`;
            } else if (addErr.code === 49 || addErr.message?.includes('Invalid Credentials')) {
              errorMessage =
                'Invalid admin credentials. Check LDAP_BIND_DN and LDAP_BIND_CREDENTIALS';
            } else if (addErr.code === 50 || addErr.message?.includes('Insufficient Access')) {
              errorMessage = `Admin account does not have permission to create users`;
            } else if (addErr.code === 53 || addErr.message?.includes('Unwilling To Perform')) {
              errorMessage =
                'LDAPS (port 636) is required to set passwords. Change LDAP_URL to ldaps://corp.example.local:636';
            } else if (addErr.code === 19 || addErr.message?.includes('Constraint Violation')) {
              errorMessage = `Password does not meet complexity requirements: ${addErr.message}`;
            } else if (addErr.message?.includes('unicodePwd')) {
              errorMessage = 'Password encoding error. Ensure LDAPS is enabled';
            } else {
              errorMessage = `${addErr.message} (LDAP Error Code: ${addErr.code || 'N/A'})`;
            }

            return reject(new BadRequestException(errorMessage));
          }

          this.logger.log(`User created successfully in LDAP: ${dto.username}`);

          // After creating user, fetch their details
          const searchFilter = `(sAMAccountName=${dto.username})`;
          const searchOptions = {
            scope: 'sub' as const,
            filter: searchFilter,
            attributes: [
              'mail',
              'displayName',
              'sAMAccountName',
              'givenName',
              'sn',
              'userPrincipalName',
            ],
          };

          this.logger.log(`Searching for created user in LDAP: ${dto.username}`);

          client.search(baseDN, searchOptions, (searchErr, searchRes) => {
            if (searchErr) {
              client.unbind();
              this.logger.error(`LDAP search failed for ${dto.username}: ${searchErr.message}`);
              return reject(
                new BadRequestException(`User created but search failed: ${searchErr.message}`),
              );
            }

            let userEntry: any = null;

            searchRes.on('searchEntry', (entry) => {
              userEntry = (entry as any).object;
              this.logger.debug(`Found user entry in LDAP for: ${dto.username}`);
            });

            searchRes.on('error', (err2) => {
              client.unbind();
              this.logger.error(`LDAP search stream error for ${dto.username}: ${err2.message}`);
              reject(new BadRequestException(`LDAP search error: ${err2.message}`));
            });

            searchRes.on('end', async () => {
              client.unbind();
              this.logger.log(`LDAP search completed for: ${dto.username}`);

              if (!userEntry) {
                this.logger.warn(`User created but not found in search: ${dto.username}`);
                return resolve({
                  message: 'User created successfully in AWS Directory Service',
                  dn: userDN,
                  username: dto.username,
                });
              }

              try {
                // Register user locally in the application
                const userProfile = {
                  email:
                    userEntry.mail ||
                    userEntry.userPrincipalName ||
                    `${dto.username}@corp.example.local`,
                  firstName: userEntry.givenName || dto.cn.split(' ')[0],
                  lastName: userEntry.sn || dto.sn,
                  username: userEntry.sAMAccountName || dto.username,
                  displayName: userEntry.displayName || dto.cn,
                  providerId: userEntry.sAMAccountName || dto.username,
                  department: userEntry.department,
                  title: userEntry.title,
                };

                this.logger.log(`Registering user locally: ${dto.username}`);
                const user = await this.validateLdapUser(userProfile);
                this.logger.log(`LDAP user registration completed successfully: ${dto.username}`);

                resolve({
                  message:
                    'User created successfully in AWS Directory Service and registered in application',
                  user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                  },
                });
              } catch (error: any) {
                this.logger.error(`Error registering user locally: ${error.message}`, error.stack);
                reject(
                  new BadRequestException(
                    `User created in LDAP but local registration failed: ${error.message}`,
                  ),
                );
              }
            });
          });
        });
      });
    });
  }

  // Helper method to encode password for Active Directory
  private encodePasswordForAD(password: string): Buffer {
    // AD requires password to be:
    // 1. Enclosed in double quotes
    // 2. Encoded as UTF-16LE
    // 3. Sent as a Buffer (not string)
    // 4. Only works over LDAPS (port 636)
    const passwordWithQuotes = `"${password}"`;
    return Buffer.from(passwordWithQuotes, 'utf16le');
  }
}
