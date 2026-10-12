import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-borde bg-panel p-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-sm font-semibold text-texto", className)} {...props} />;
}

export function CardMuted({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs text-apagado", className)} {...props} />;
}
