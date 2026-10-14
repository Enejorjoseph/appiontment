import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

function controlClass(invalid?: boolean): string {
  return cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400",
    invalid
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-navy-200 focus:border-brand-500 focus:ring-brand-100",
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid ? true : undefined}
      className={cn(controlClass(invalid), className)}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid ? true : undefined}
      className={cn(controlClass(invalid), "min-h-24 resize-y", className)}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      aria-invalid={invalid ? true : undefined}
      className={cn(controlClass(invalid), "pr-8", className)}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-navy-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  label,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label htmlFor={id} className={cn("inline-flex items-center gap-2 text-sm text-navy-700", className)}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
        {...props}
      />
      {label}
    </label>
  );
}
