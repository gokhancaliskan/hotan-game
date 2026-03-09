import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat.entity';
import { UserEntity } from '../user/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getMessages(limit = 50, offset = 0): Promise<ChatMessage[]> {
    return this.chatRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async createMessage(userId: string, message: string): Promise<ChatMessage> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.bannedFromChat) {
      throw new ForbiddenException('You are banned from chat');
    }

    const chatMessage = this.chatRepo.create({ message, userId });
    const saved = await this.chatRepo.save(chatMessage);

    return (await this.chatRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    }))!;
  }

  async editMessage(
    messageId: string,
    newMessage: string,
    userId: string,
    userRole: Role,
  ): Promise<ChatMessage> {
    const chatMessage = await this.chatRepo.findOne({
      where: { id: messageId },
      relations: ['user'],
    });

    if (!chatMessage) {
      throw new NotFoundException('Message not found');
    }

    // Users can only edit their own messages, admins can edit any
    if (userRole !== Role.ADMIN && chatMessage.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    chatMessage.message = newMessage;
    return this.chatRepo.save(chatMessage);
  }

  async deleteMessage(
    messageId: string,
    userId: string,
    userRole: Role,
  ): Promise<{ id: string }> {
    const chatMessage = await this.chatRepo.findOne({
      where: { id: messageId },
    });

    if (!chatMessage) {
      throw new NotFoundException('Message not found');
    }

    // Users can only delete their own messages, admins can delete any
    if (userRole !== Role.ADMIN && chatMessage.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.chatRepo.remove(chatMessage);
    return { id: messageId };
  }

  async banUser(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.bannedFromChat = true;
    return this.userRepo.save(user);
  }
}
