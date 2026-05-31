import { TenantDto } from '../../schemas';

export interface TenantRepository {
  findAll(): Promise<
    TenantDto[]
  >;

  findById(
    id: string
  ): Promise<TenantDto | null>;
}
