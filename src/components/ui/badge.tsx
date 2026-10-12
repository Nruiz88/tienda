import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variantes = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide",
  {
    variants: {
      tono: {
        neutro: "border-borde bg-panel-2 text-claro",
        acento: "border-acento/40 bg-acento/10 text-acento",
        ok: "border-ok/40 bg-ok/10 text-ok",
        aviso: "border-aviso/40 bg-aviso/10 text-aviso",
        mal: "border-mal/40 bg-mal/10 text-mal",
      },
    },
    defaultVariants: { tono: "neutro" },
  }
);

export function Badge({
  className,
  tono,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof variantes>) {
  return <span className={cn(variantes({ tono }), className)} {...props} />;
}
