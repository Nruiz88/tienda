import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variantes = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transicion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-acento text-acento-oscuro hover:brightness-110",
        outline: "border-borde bg-transparent text-texto hover:bg-panel-2",
        ghost: "border-transparent bg-transparent text-apagado hover:bg-panel-2 hover:text-texto",
        destructive: "border-transparent bg-mal text-acento-oscuro hover:brightness-110",
      },
      size: {
        default: "px-3.5",
        sm: "px-2.5 text-[0.8rem]",
        lg: "px-5 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof variantes>) {
  return <button className={cn(variantes({ variant, size }), className)} {...props} />;
}

export { variantes as variantesBoton };
