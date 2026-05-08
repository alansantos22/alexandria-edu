import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  username: string;

  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Senha deve conter ao menos uma maiúscula, uma minúscula e um número',
  })
  password: string;
}
