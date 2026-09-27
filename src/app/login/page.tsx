import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesion | Laboratorios Sistemas Informatica UMSS",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-primary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-card-border shadow-lg overflow-hidden">
          <div className="bg-primary px-6 py-7 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="font-primary text-xl font-bold text-white">
              Laboratorios Sistemas Informatica
            </h1>
            <p className="mt-1 font-secondary text-sm text-gray-300">
              Plataforma de formacion continua &middot; CS - UMSS
            </p>
          </div>

          <div className="px-6 py-6">
            <h2 className="mb-1 font-primary text-lg font-bold text-text-main">
              Iniciar sesion
            </h2>
            <p className="mb-6 font-secondary text-sm text-text-muted">
              Ingresa con tu correo institucional y contrasena.
            </p>
            <LoginForm />
          </div>
        </div>

        <p className="mt-4 text-center font-secondary text-xs text-gray-300">
          Universidad Mayor de San Simon &middot; Cochabamba, Bolivia
        </p>
      </div>
    </div>
  );
}
