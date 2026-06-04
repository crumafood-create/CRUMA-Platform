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
  value?: any;
  onValueChange?: any;
  children?: ReactNode;
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
      value={value ?? ''}
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

export function SelectValue({
  placeholder,
  children,
}: {
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <span>
      {children ?? placeholder}
    </span>
  );
}

export function Form(props: any) {
  const {
    children,
    form,
    ...rest
  } = props;

  return (
    <form {...rest}>
      {children}
    </form>
  );
}

export function FormField({
  children,
  name,
  control,
}: {
  children?: ReactNode;
  name?: string;
  control?: any;
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
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

export function Input(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} />;
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return <textarea {...props} />;
}

type SelectProps = {
  value?: any;
  onValueChange?: (value: any) => void;
  children?: ReactNode;
};

export function FormInput(props: any) {
  return <Input {...props} />;
}

export function FormSelect(props: any) {
  return <Select {...props} />;
}

export function FormSwitch(props: any) {
  return (
    <input
      type="checkbox"
      {...props}
    />
  );
}

export function FormSubmit(props: any) {
  return (
    <button
      type="submit"
      {...props}
    />
  );
}

export function Select({
  value,
  onValueChange,
  children,
}: SelectProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) =>
        onValueChange?.(e.target.value)
      }
    >
      {children}
    </select>
  );
}

export function SelectTrigger(props: any) {
  return (
    <div {...props}>
      {props.children}
    </div>
  );
}

export function SelectContent(props: any) {
  return (
    <div {...props}>
      {props.children}
    </div>
  );
}

export function SelectItem({
  children,
  value,
}: {
  children?: ReactNode;
  value?: string;
}) {
  return (
    <option value={value}>
      {children}
    </option>
  );
}

export function SelectValue({
  placeholder,
  children,
}: {
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <span>
      {children ?? placeholder}
    </span>
  );
}

export function Form(props: any) {
  const {
    children,
    form,
    ...rest
  } = props;

  return (
    <form {...rest}>
      {children}
    </form>
  );
}

export function FormField(props: any) {
  return <>{props.children}</>;
}

export function FormItem(props: any) {
  return (
    <div {...props}>
      {props.children}
    </div>
  );
}

export function FormLabel(props: any) {
  return (
    <label {...props}>
      {props.children}
    </label>
  );
}

export function FormControl(props: any) {
  return <>{props.children}</>;
}

export function FormDescription(props: any) {
  return (
    <p {...props}>
      {props.children}
    </p>
  );
}

export function FormMessage(props: any) {
  return (
    <p {...props}>
      {props.children}
    </p>
  );
}

export function FormSection(props: any) {
  return (
    <section {...props}>
      {props.children}
    </section>
  );
}

export function SubmitButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      type="submit"
      {...props}
    />
  );
}

export function FieldError(props: any) {
  return (
    <p {...props}>
      {props.children}
    </p>
  );
}
