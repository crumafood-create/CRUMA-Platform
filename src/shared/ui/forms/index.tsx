import type {
  ButtonHTMLAttributes,
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

export function Select(props: any) {
  return (
    <select
      value={props.value ?? ''}
      onChange={(e) =>
        props.onValueChange?.(
          e.target.value
        )
      }
    >
      {props.children}
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
