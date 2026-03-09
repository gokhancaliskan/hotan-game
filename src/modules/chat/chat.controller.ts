import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Public } from '../../common/decorators';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Everyone can read messages */
  @Public()
  @Get('messages')
  getMessages(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getMessages(limit || 50, offset || 0);
  }
}
