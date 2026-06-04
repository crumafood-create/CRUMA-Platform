import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
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
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function SelectValue({
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props}>{children}</span>;
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
