import { PrismaClient } from '@prisma/client';

import { PermissionRepository } from '../../application/contracts/permission.repository';

import { PermissionDto } from '../../schemas';

const prisma = new PrismaClient();

export class PrismaPermissionRepository
  implements PermissionRepository
{
  async findAll(): Promise<
    PermissionDto[]
  > {
    return prisma.permission.findMany() as Promise<
      PermissionDto[]
    >;
  }
}
