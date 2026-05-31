import { UserSchema } from '../../schemas';

export class CreateUserUseCase {
  execute(data: unknown) {
    const user =
      UserSchema.parse(data);

    return user;
  }
}
