import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, IsStrongPassword } from 'class-validator';
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
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Şifre çok zayıf! (En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 sayı ve 1 özel karakter içermeli)',
    },
  )
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
