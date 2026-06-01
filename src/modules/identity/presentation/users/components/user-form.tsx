'use client';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  UserSchema,
  UserDto,
} from '@/modules/identity/schemas';

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSwitch,
  FormSubmit,
} from '@/shared/ui/forms';

interface UserFormProps {
  defaultValues?: Partial<UserDto>;

  loading?: boolean;

  roles?: {
    label: string;
    value: string;
  }[];

  onSubmit: (
    values: UserDto
  ) => Promise<void>;
}

export function UserForm({
  defaultValues,
  loading,
  roles = [],
  onSubmit,
}: UserFormProps) {
  const form = useForm<UserDto>({
    resolver:
      zodResolver(UserSchema),

    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      roleIds: [],
      active: true,
      ...defaultValues,
    },
  });

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(
        onSubmit
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          name="firstName"
          control={form.control}
        >
          <FormInput
            label="Nombre"
            placeholder="Juan"
          />
        </FormField>

        <FormField
          name="lastName"
          control={form.control}
        >
          <FormInput
            label="Apellido"
            placeholder="Pérez"
          />
        </FormField>
      </div>

      <FormField
        name="email"
        control={form.control}
      >
        <FormInput
          type="email"
          label="Correo"
          placeholder="usuario@cruma.mx"
        />
      </FormField>

      <FormField
        name="roleIds"
        control={form.control}
      >
        <FormSelect
          label="Rol"

          options={roles}

          placeholder="Seleccionar rol"
        />
      </FormField>

      <FormField
        name="active"
        control={form.control}
      >
        <FormSwitch
          label="Usuario activo"
        />
      </FormField>

      <FormSubmit
        loading={loading}
      >
        Guardar Usuario
      </FormSubmit>
    </Form>
  );
}
