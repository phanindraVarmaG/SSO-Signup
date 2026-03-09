import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {
    this.logger.log('UsersController initialized');
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })  getProfile(@Request() req): ApiResponseDto {
    try {
      this.logger.log(`Profile request for user: ${req.user.userId}`);
      const user = this.usersService.findById(req.user.userId);
      
      // Remove sensitive data
      const { passwordHash, ...userProfile } = user;
      
      return ApiResponseDto.success(userProfile, 'Profile retrieved successfully');
    } catch (error: any) {
      this.logger.error(`Error getting profile: ${error.message}`, error.stack);
      return ApiResponseDto.error('Internal server error', error.message, 500);
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getAllUsers(@Request() req): ApiResponseDto {
    try {
      this.logger.log(`Get all users request by: ${req.user.userId}`);
      
      // Check if admin
      const currentUser = this.usersService.findById(req.user.userId);
      if (!currentUser.isAdmin) {
        return ApiResponseDto.error('Admin access required', 'Forbidden', 403);
      }

      const users = this.usersService.findAll().map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return ApiResponseDto.success(users, 'Users retrieved successfully');
    } catch (error: any) {
      this.logger.error(`Error getting users: ${error.message}`, error.stack);
      return ApiResponseDto.error('Internal server error', error.message, 500);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id') id: string, @Request() req): ApiResponseDto {
    try {
      this.logger.log(`Get user by ID: ${id}`);
      
      // Users can only view their own profile unless they're admin
      const currentUser = this.usersService.findById(req.user.userId);
      if (id !== req.user.userId && !currentUser.isAdmin) {
        return ApiResponseDto.error('Access denied', 'Forbidden', 403);
      }

      const user = this.usersService.findById(id);
      const { passwordHash, ...userProfile } = user;

      return ApiResponseDto.success(userProfile, 'User retrieved successfully');
    } catch (error: any) {
      this.logger.error(`Error getting user: ${error.message}`, error.stack);
      return ApiResponseDto.error(error.message, error.status || 500);
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req,
  ): ApiResponseDto {
    try {
      this.logger.log(`Update user: ${id}`);

      // Users can only update their own profile unless they're admin
      const currentUser = this.usersService.findById(req.user.userId);
      if (id !== req.user.userId && !currentUser.isAdmin) {
        return ApiResponseDto.error('Access denied', 'Forbidden', 403);
      }

      // Don't allow updating sensitive fields
      delete updateData.passwordHash;
      delete updateData.id;
      delete updateData.provider;
      delete updateData.providerId;
      if (!currentUser.isAdmin) {
        delete updateData.isAdmin;
      }

      const user = this.usersService.updateUser(id, updateData);
      const { passwordHash, ...userProfile } = user;

      return ApiResponseDto.success(userProfile, 'User updated successfully');
    } catch (error: any) {
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      return ApiResponseDto.error(error.message, error.status || 500);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  deleteUser(@Param('id') id: string, @Request() req): ApiResponseDto {
    try {
      this.logger.log(`Delete user: ${id}`);

      // Only admins can delete users
      const currentUser = this.usersService.findById(req.user.userId);
      if (!currentUser.isAdmin) {
        return ApiResponseDto.error('Admin access required', 'Forbidden', 403);
      }

      this.usersService.deleteUser(id);
      return ApiResponseDto.success(null, 'User deleted successfully');
    } catch (error: any) {
      this.logger.error(`Error deleting user: ${error.message}`, error.stack);
      return ApiResponseDto.error(error.message, error.status || 500);
    }
  }
}
