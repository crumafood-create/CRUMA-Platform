import { PrismaClient } from '@prisma/client';

import { RoleRepository } from '../../application/contracts/role.repository';

import { RoleDto } from '../../schemas';

const prisma = new PrismaClient();

export class PrismaRoleRepository
  implements RoleRepository
{
  async findAll(): Promise<RoleDto[]> {
    return prisma.role.findMany() as Promise<
      RoleDto[]
    >;
  }

  async findById(
    id: string
  ): Promise<RoleDto | null> {
    return prisma.role.findUnique({
      where: { id },
    }) as Promise<RoleDto | null>;
  }
}
