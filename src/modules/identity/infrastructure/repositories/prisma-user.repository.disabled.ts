import { PrismaClient } from '@prisma/client';

import { UserRepository } from '../../application/contracts/user.repository';

import { UserDto } from '../../schemas';

const prisma = new PrismaClient();

export class PrismaUserRepository
  implements UserRepository
{
  async create(
    user: UserDto
  ): Promise<UserDto> {
    const created =
      await prisma.user.create({
        data: user,
      });

    return created as UserDto;
  }

  async update(
    id: string,
    user: UserDto
  ): Promise<UserDto> {
    const updated =
      await prisma.user.update({
        where: { id },
        data: user,
      });

    return updated as UserDto;
  }

  async delete(
    id: string
  ): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findById(
    id: string
  ): Promise<UserDto | null> {
    return prisma.user.findUnique({
      where: { id },
    }) as Promise<UserDto | null>;
  }

  async findAll(): Promise<UserDto[]> {
    return prisma.user.findMany() as Promise<
      UserDto[]
    >;
  }
}
