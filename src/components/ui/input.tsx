"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={`input-premium ${className ?? ""}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
