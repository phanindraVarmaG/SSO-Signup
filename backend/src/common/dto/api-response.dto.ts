import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  @ApiProperty({ description: 'Error details', required: false })
  error?: string;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message: string = 'Success', statusCode: number = 200): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  static error(message: string, error?: string, statusCode: number = 500): ApiResponseDto {
    return new ApiResponseDto({
      success: false,
      statusCode,
      message,
      error,
    });
  }
}
