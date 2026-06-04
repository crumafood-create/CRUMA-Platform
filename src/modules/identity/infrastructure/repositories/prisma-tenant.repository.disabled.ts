import { PrismaClient } from '@prisma/client';

import { TenantRepository } from '../../application/contracts/tenant.repository';

import { TenantDto } from '../../schemas';

const prisma = new PrismaClient();

export class PrismaTenantRepository
  implements TenantRepository
{
  async findAll(): Promise<
    TenantDto[]
  > {
    return prisma.tenant.findMany() as Promise<
      TenantDto[]
    >;
  }

  async findById(
    id: string
  ): Promise<TenantDto | null> {
    return prisma.tenant.findUnique({
      where: { id },
    }) as Promise<TenantDto | null>;
  }
}
