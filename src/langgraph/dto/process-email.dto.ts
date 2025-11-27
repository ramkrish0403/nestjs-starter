import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessEmailDto {
  @IsString()
  @IsNotEmpty()
  emailContent: string;

  @IsEmail()
  @IsNotEmpty()
  senderEmail: string;

  @IsString()
  @IsOptional()
  emailId?: string;
}
