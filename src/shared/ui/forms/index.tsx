import type {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

type LabeledInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function FormInput({ label, error, ...props }: LabeledInputProps) {
  return (
    <label>
      {label ? <span>{label}</span> : null}
      <Input {...props} />
      {error ? <FieldError>{error}</FieldError> : null}
    </label>
  );
}

type Option = { label: string; value: string };
type FormSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label?: string;
  options?: Option[];
  placeholder?: string;
  onValueChange?: ((value: string) => void) | undefined;
};

export function FormSelect({ label, options = [], placeholder, onValueChange, ...props }: FormSelectProps) {
  return (
    <label>
      {label ? <span>{label}</span> : null}
      <select {...props} onChange={(event) => onValueChange?.(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

type FormSwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string };

export function FormSwitch({ label, ...props }: FormSwitchProps) {
  return <label><input type="checkbox" {...props} />{label}</label>;
}

type FormSubmitProps = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean | undefined };

export function FormSubmit({ loading = false, disabled, children, ...props }: FormSubmitProps) {
  return <button type="submit" disabled={disabled || loading} {...props}>{loading ? 'Guardando…' : children}</button>;
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  onValueChange?: ((value: string) => void) | undefined;
};

export function Select({ onValueChange, children, ...props }: SelectProps) {
  return <select {...props} onChange={(event) => onValueChange?.(event.target.value)}>{children}</select>;
}

export function SelectTrigger({ children }: HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>;
}

export function SelectContent({ children }: HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>;
}

export function SelectItem({ children, value }: { children?: ReactNode; value?: string }) {
  return <option value={value}>{children}</option>;
}

export function SelectValue({ placeholder, children }: { placeholder?: string; children?: ReactNode }) {
  return <>{children ?? (placeholder ? <option value="">{placeholder}</option> : null)}</>;
}

type FormProps = FormHTMLAttributes<HTMLFormElement> & { form?: unknown };

export function Form({ children, form: _form, ...props }: FormProps) {
  return <form {...props}>{children}</form>;
}

type FormFieldProps<TValues extends FieldValues> = {
  name: Path<TValues>;
  control: Control<TValues>;
  children: ReactNode;
};

export function FormField<TValues extends FieldValues>({ children }: FormFieldProps<TValues>) {
  return <>{children}</>;
}

export function FormItem(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export function FormLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} />;
}

export function FormControl({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function FormDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} />;
}

export function FormMessage(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} />;
}

export function FormSection(props: HTMLAttributes<HTMLElement>) {
  return <section {...props} />;
}

export function SubmitButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="submit" {...props} />;
}

export function FieldError(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} />;
}
