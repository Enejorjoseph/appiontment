"use client";

import { useRef, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ConfirmSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function ConfirmSubmitButton({
  message,
  title,
  confirmLabel,
  cancelLabel,
  destructive,
  onClick,
  children,
  ...props
}: ConfirmSubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  if (!message) {
    return (
      <button ref={buttonRef} type="submit" onClick={onClick} {...props}>
        {children}
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="submit"
        onClick={(event) => {
          event.preventDefault();
          onClick?.(event);
          setOpen(true);
        }}
        {...props}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        destructive={destructive}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          buttonRef.current?.form?.requestSubmit(buttonRef.current);
        }}
      />
    </>
  );
}
