import { IsOptional, IsString, IsEmail, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  bannedFromChat?: boolean;
}

export class BanChatDto {
  @IsBoolean()
  banned: boolean;
}
