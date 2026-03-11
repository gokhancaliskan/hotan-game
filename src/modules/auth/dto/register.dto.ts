import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

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
  password: string;
}
