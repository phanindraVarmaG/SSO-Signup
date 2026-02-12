import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LdapRegisterDto {
  @ApiProperty({ example: 'testuser11' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username: string;

  @ApiProperty({ example: 'Test User 11' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  cn: string;

  @ApiProperty({ example: 'User11' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  sn: string;

  @ApiProperty({ example: 'testpassword' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}
