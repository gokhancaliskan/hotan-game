import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ChatModule } from './modules/chat/chat.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EnvironmentVariables, validate } from './common/config';

@Module({
  imports: [
    // Environment variables — type-safe with validation
    ConfigModule.forRoot({ isGlobal: true, validate }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),

    // Feature modules
    AuthModule,
    UserModule,
    ChatModule,
  ],
  providers: [
    // Global JWT guard — all routes require JWT unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global Role guard — enforces @Public() / @User() / admin-only
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
