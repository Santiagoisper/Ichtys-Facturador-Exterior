import { ClientForm } from "@/components/client-form";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#134252]">Ingresar Cliente</h1>
        <p className="text-muted-foreground">
          Completa los datos del nuevo cliente
        </p>
      </div>
      <ClientForm />
    </div>
  );
}
