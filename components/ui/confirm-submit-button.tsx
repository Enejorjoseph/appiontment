"use client";

import type { ButtonHTMLAttributes } from "react";

interface ConfirmSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
}

export function ConfirmSubmitButton({
  message,
  onClick,
  children,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (message && !window.confirm(message)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
