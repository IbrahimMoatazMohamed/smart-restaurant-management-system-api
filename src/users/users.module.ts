import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { RolesModule } from '../roles/roles.module';
import { LoggerModule } from '../logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminTokenGuard } from '../auth/guards/super-admin-token.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    FileUploadModule,
    RolesModule,
    LoggerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, SuperAdminTokenGuard],
  exports: [UsersService],
})
export class UsersModule {}
