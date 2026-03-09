import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LdapService } from './ldap.service';
import { JwtService } from '@nestjs/jwt';
import { LdapLoginDto } from '../auth/dto/ldap-login.dto';
import { LdapRegisterDto } from '../auth/dto/ldap-register.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('ldap-auth')
@Controller('auth/ldap')
export class LdapController {
  private readonly logger = new Logger(LdapController.name);

  constructor(
    private readonly ldapService: LdapService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('LdapController initialized');
  }

  @Post()
  @UseGuards(AuthGuard('ldap'))
  @ApiOperation({ summary: 'LDAP login' })
  @ApiBody({ type: LdapLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async ldapLogin(@Request() req, @Body() ldapLoginDto: LdapLoginDto): Promise<ApiResponseDto> {
    try {
      this.logger.log(`LDAP login attempt for username: ${ldapLoginDto.username}`);
      
      const user = await this.ldapService.validateLdapUser(req.user);

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin || false,
      };
      const access_token = this.jwtService.sign(payload);

      this.logger.log(`LDAP login successful for: ${ldapLoginDto.username}`);

      return ApiResponseDto.success(
        {
          access_token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            displayName: user.displayName,
            provider: user.provider,
            department: user.department,
            title: user.title,
            isAdmin: user.isAdmin || false,
          },
        },
        'Login successful',
      );
    } catch (error: any) {
      this.logger.error(`LDAP login failed for ${ldapLoginDto.username}: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new UnauthorizedException('LDAP authentication failed');
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new LDAP user' })
  @ApiBody({ type: LdapRegisterDto })
  @ApiResponse({ status: 201, description: 'LDAP user successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async ldapRegister(@Body() ldapRegisterDto: LdapRegisterDto): Promise<ApiResponseDto> {
    try {
      this.logger.log(`LDAP registration attempt for username: ${ldapRegisterDto.username}`);
      const result = await this.ldapService.ldapRegister(ldapRegisterDto);
      this.logger.log(`LDAP registration successful for: ${ldapRegisterDto.username}`);
      return ApiResponseDto.success(result, 'User created successfully in AWS Directory Service', 201);
    } catch (error: any) {
      this.logger.error(
        `LDAP registration failed for ${ldapRegisterDto.username}: ${error.message}`,
        error.stack,
      );

      // Convert various error types to proper HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      throw new UnauthorizedException(error.message || 'LDAP registration failed');
    }
  }
}
