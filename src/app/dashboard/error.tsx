"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <h2 className="text-2xl font-bold text-[#134252]">
        Algo salio mal
      </h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || "Ocurrio un error inesperado. Intenta nuevamente."}
      </p>
      <Button
        onClick={reset}
        className="bg-[#1a7482] hover:bg-[#134252]"
      >
        Intentar de nuevo
      </Button>
    </div>
  );
}
