export class DeleteUserUseCase {
  execute(id: string) {
    return {
      success: true,
      id,
    };
  }
}
