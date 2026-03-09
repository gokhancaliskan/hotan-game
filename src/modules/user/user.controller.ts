import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, BanChatDto } from './dto';
import { User } from '../../common/decorators';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Admin only — no decorator */
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  /** Admin only — no decorator */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  /** Admin only — no decorator */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  /** Admin only — no decorator */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

  /** Admin only — no decorator */
  @Patch(':id/ban-chat')
  banFromChat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BanChatDto,
  ) {
    return this.userService.banFromChat(id, dto.banned);
  }
}
