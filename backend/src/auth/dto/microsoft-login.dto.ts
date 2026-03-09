import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MicrosoftLoginDto {
  @ApiProperty({ description: 'Microsoft access token', example: '...' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
