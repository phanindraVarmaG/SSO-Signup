import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { GoogleDriveGmailController } from '../controllers/google-drive-gmail.controller';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GoogleController, GoogleDriveGmailController],
  providers: [GoogleService, GoogleStrategy],
  exports: [GoogleService],
})
export class GoogleModule {}
