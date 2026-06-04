import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
};

export function FormInput(props: any) {
  return <Input {...props} />;
}

export function FormSelect(props: any) {
  return <Select {...props} />;
}

export function FormSwitch(props: any) {
  return <input type="checkbox" {...props} />;
}

export function FormSubmit(props: any) {
  return <button type="submit" {...props} />;
}

export function Select({
  value,
  onValueChange,
  children,
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onValueChange?.(e.target.value)
      }
    >
      {children}
    </select>
  );
}

export function SelectTrigger({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function SelectContent({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function SelectItem({
  children,
  value,
}: {
  children?: ReactNode;
  value?: string;
}) {
  return <option value={value}>{children}</option>;
}

export function SelectValue() {
  return null;
}

export function Form({
  children,
  ...props
}: HTMLAttributes<HTMLFormElement>) {
  return <form {...props}>{children}</form>;
}

export function FormField({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function FormItem({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function FormLabel({
  children,
  ...props
}: HTMLAttributes<HTMLLabelElement>) {
  return <label {...props}>{children}</label>;
}

export function FormDescription({
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props}>{children}</p>;
}

export function FormMessage({
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props}>{children}</p>;
}

export function FormSection({
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section {...props}>{children}</section>;
}

export function SubmitButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
) {
  return <button type="submit" {...props} />;
}

export function FieldError({
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props}>{children}</p>;
}
