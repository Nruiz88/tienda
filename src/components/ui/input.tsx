import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-borde bg-hundido px-3 text-sm text-texto placeholder:text-apagado",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1 block text-xs font-semibold uppercase tracking-wider text-apagado", className)}
      {...props}
    />
  );
}
