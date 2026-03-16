import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { UpdateUserDto } from './dto';
import { Role } from '../../common/enums/role.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }

  async banFromChat(id: string, banned: boolean): Promise<UserEntity> {
    const user = await this.findOne(id);
    user.bannedFromChat = banned;
    return this.userRepo.save(user);
  } 
async onModuleInit() {
    const adminExists = await this.userRepo.findOne({ where: { role: Role.ADMIN } });

    if (!adminExists) {
      // Artık validate edildiği için kesinlikle oradalar!
      const adminUser = this.configService.get<string>('DEFAULT_ADMIN_USER');
      const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
      const adminPass = this.configService.get<string>('DEFAULT_ADMIN_PASS');

      const hashedPassword = await bcrypt.hash(adminPass, 12);
      
      const admin = this.userRepo.create({
        username: adminUser,
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        bannedFromChat: false
      });

      await this.userRepo.save(admin);
      console.log(`🚀 SİSTEM: Otomatik admin (${adminUser}) oluşturuldu!`);
    }
  }
  
  // Senin mevcut banFromChat metodun zaten çok iyi, dokunma.
}

