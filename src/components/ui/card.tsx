"use client";

import { forwardRef, type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md";
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, size = "md", hover = true, ...props }, ref) => (
    <div
      ref={ref}
      className={`premium-card ${size === "sm" ? "p-4" : "p-5 sm:p-6"} ${hover ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""} ${className ?? ""}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col gap-1.5 mb-4 ${className ?? ""}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={`text-base font-semibold font-heading text-foreground ${className ?? ""}`} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={`text-sm text-muted-foreground/70 ${className ?? ""}`} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className ?? ""} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex items-center pt-4 ${className ?? ""}`} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
