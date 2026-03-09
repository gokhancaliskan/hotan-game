import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto, EditMessageDto, DeleteMessageDto, BanUserDto } from './dto';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../auth/jwt.strategy';
import { Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate WebSocket connections via JWT.
   * Token can be sent as:
   *   - query param: ?token=xxx
   *   - auth header: { token: 'xxx' } in handshake
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token (read-only)`);
        return; // Allow connection for read-only (receive_message)
      }

      const payload = this.jwtService.verify<JwtPayload>(token as string);
      client.user = payload;
      this.logger.log(`Client ${client.id} authenticated as ${payload.role} (${payload.id})`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} invalid token: ${error.message}`);
      // Don't disconnect — allow read-only access
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * send_message → user/admin only, blocked if banned
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    if (!client.user) {
      return { event: 'error', data: { message: 'Authentication required' } };
    }

    if (client.user.role !== Role.USER && client.user.role !== Role.ADMIN) {
      return { event: 'error', data: { message: 'Insufficient permissions' } };
    }

    try {
      const message = await this.chatService.createMessage(
        client.user.id,
        data.message,
      );

      // Broadcast to everyone
      this.server.emit('receive_message', message);

      return { event: 'send_message', data: { success: true, message } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  /**
   * edit_message → user edits own, admin edits any
   */
  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: EditMessageDto,
  ) {
    if (!client.user) {
      return { event: 'error', data: { message: 'Authentication required' } };
    }

    try {
      const message = await this.chatService.editMessage(
        data.messageId,
        data.message,
        client.user.id,
        client.user.role as Role,
      );

      // Broadcast edited message to everyone
      this.server.emit('message_edited', message);

      return { event: 'edit_message', data: { success: true, message } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  /**
   * delete_message → user deletes own, admin deletes any
   */
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: DeleteMessageDto,
  ) {
    if (!client.user) {
      return { event: 'error', data: { message: 'Authentication required' } };
    }

    try {
      const result = await this.chatService.deleteMessage(
        data.messageId,
        client.user.id,
        client.user.role as Role,
      );

      // Broadcast deletion to everyone
      this.server.emit('message_deleted', result);

      return { event: 'delete_message', data: { success: true, ...result } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  /**
   * ban_user → admin only
   */
  @SubscribeMessage('ban_user')
  async handleBanUser(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: BanUserDto,
  ) {
    if (!client.user) {
      return { event: 'error', data: { message: 'Authentication required' } };
    }

    if (client.user.role !== Role.ADMIN) {
      return { event: 'error', data: { message: 'Admin access only' } };
    }

    try {
      const user = await this.chatService.banUser(data.userId);

      this.server.emit('user_banned', {
        userId: user.id,
        username: user.username,
      });

      return { event: 'ban_user', data: { success: true, userId: user.id } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }
}
