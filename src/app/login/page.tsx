"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_INFO } from "@/lib/constants";
import { loginWithPassword } from "@/app/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginWithPassword(email, password);

      if (result?.error) {
        if (
          result.error === "network_error" ||
          result.error.toLowerCase().includes("fetch") ||
          result.error.toLowerCase().includes("network")
        ) {
          setError(`Error de conexion: ${result.error}`);
        } else if (result.error.toLowerCase().includes("invalid login")) {
          setError("Email o password incorrecto");
        } else {
          setError(result.error);
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Error de red al iniciar sesion. Verifica conexion o variables de entorno."
      );
      setLoading(false);
      return;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#134252] to-[#1a7482] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-[#134252] rounded-full flex items-center justify-center mb-2">
            <span className="text-white font-bold text-xl">I</span>
          </div>
          <CardTitle className="text-2xl font-bold text-[#134252]">
            {COMPANY_INFO.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {COMPANY_INFO.legalName}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ichtys.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#1a7482] hover:bg-[#134252]"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar Sesion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
