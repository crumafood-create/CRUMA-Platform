import { RoleDto } from '../../schemas';

export interface RoleRepository {
  findAll(): Promise<RoleDto[]>;

  findById(
    id: string
  ): Promise<RoleDto | null>;
}
