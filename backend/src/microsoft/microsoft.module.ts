import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MicrosoftController } from './microsoft.controller';
import { MicrosoftService } from './microsoft.service';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { UsersModule } from '../users/users.module';

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
  controllers: [MicrosoftController],
  providers: [MicrosoftService, MicrosoftStrategy],
  exports: [MicrosoftService],
})
export class MicrosoftModule {}
