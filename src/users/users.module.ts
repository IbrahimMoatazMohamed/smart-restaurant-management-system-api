import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { RolesModule } from '../roles/roles.module';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '@nestjs/config';
import { SuperAdminTokenGuard } from '../auth/guards/super-admin-token.guard';
import { TenantModule } from '../tenant/tenant.module';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    FileUploadModule,
    forwardRef(() => RolesModule),
    LoggerModule,
    TenantModule,
    forwardRef(() => AuthModule),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, SuperAdminTokenGuard],
  exports: [UsersService],
})
export class UsersModule {}
