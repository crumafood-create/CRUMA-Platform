import { UserSchema } from '../../schemas';

export class UpdateUserUseCase {
  execute(data: unknown) {
    const user =
      UserSchema.parse(data);

    return user;
  }
}
