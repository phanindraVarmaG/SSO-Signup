import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    description: "User password",
    example: "password123",
    minLength: 6,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(64, { message: "Password must not exceed 64 characters" })
  password: string;

  @ApiProperty({
    description: "User first name",
    example: "John",
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;
}
