import {
  Controller,
  Post,
  Body,
  Logger,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
    this.logger.log('AuthController initialized');
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or user already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponseDto> {
    try {
      this.logger.log(`Registration attempt for email: ${registerDto.email}`);
      
      const result = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      );

      this.logger.log(`Registration successful for: ${registerDto.email}`);
      return ApiResponseDto.success(result, 'User registered successfully', 201);
    } catch (error: any) {
      this.logger.error(`Registration failed for ${registerDto.email}: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new UnauthorizedException(error.message || 'Registration failed');
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto> {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      const result = await this.authService.login(user);

      this.logger.log(`Login successful for: ${loginDto.email}`);
      return ApiResponseDto.success(result, 'Login successful');
    } catch (error: any) {
      this.logger.error(`Login failed for ${loginDto.email}: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
