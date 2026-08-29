"use client";

export function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-heading font-semibold text-[12.5px] text-text mb-1.5">
        {label} {optional && <span className="font-medium text-text-muted">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full h-11 rounded-[10px] border border-border bg-surface px-3.5 text-sm text-text ${className}`}
    />
  );
}

export function AmountInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-heading font-semibold text-sm">
        &#8377;
      </div>
      <input
        {...rest}
        type="number"
        className={`w-full h-11 rounded-[10px] border border-border bg-surface pl-7 pr-3.5 text-sm text-text ${className}`}
      />
    </div>
  );
}
