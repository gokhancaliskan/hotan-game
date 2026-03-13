import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../user/user.entity';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './jwt.strategy';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const adminExists = await this.userRepo.findOne({
      where: { role: Role.ADMIN },
    });

    if (adminExists) {
      this.logger.log('Admin user already exists. Skipping creation.');
      return;
    }

    const username = this.configService.get<string>('ADMIN_USERNAME');
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    const conflictingUser = await this.userRepo.findOne({
      where: [{ username }, { email }],
    });

    if (conflictingUser) {
      this.logger.error(
        `A user with the default admin username ('${username}') or email ('${email}') already exists but is not an admin. Please resolve this conflict.`,
      );
      return;
    }

    this.logger.log('No admin user found. Creating default admin...');
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = this.userRepo.create({
      username,
      email,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await this.userRepo.save(admin);
    this.logger.log(`Default admin user '${username}' created successfully.`);
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
    });

    await this.userRepo.save(user);

    const payload: JwtPayload = { id: user.id, role: user.role };

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      select: ['id', 'username', 'email', 'password', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { id: user.id, role: user.role };

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }
}
