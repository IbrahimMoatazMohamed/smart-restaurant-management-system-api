import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const AdminOnly = () => Roles('admin');

// presentation short()
// github repositories
// deployement (huroko, digitalocean, mysqlgate)
