import { UserDto } from '../../schemas';

export interface UserRepository {
  create(
    user: UserDto
  ): Promise<UserDto>;

  update(
    id: string,
    user: UserDto
  ): Promise<UserDto>;

  delete(
    id: string
  ): Promise<void>;

  findById(
    id: string
  ): Promise<UserDto | null>;

  findAll(): Promise<UserDto[]>;
}
