import { PermissionDto } from '../../schemas';

export interface PermissionRepository {
  findAll(): Promise<
    PermissionDto[]
  >;
}
