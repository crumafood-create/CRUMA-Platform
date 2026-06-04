import type { HTMLAttributes } from 'react';

export function Avatar({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}

export function AvatarImage(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  return <img {...props} />;
}

export function AvatarFallback({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}
