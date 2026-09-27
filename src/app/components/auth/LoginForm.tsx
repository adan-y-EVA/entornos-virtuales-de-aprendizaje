'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, LogIn, Mail, Lock } from 'lucide-react';

import { Button } from '../Button';
import { Input } from './Input';
import { loginSchema, type LoginFormValues } from '@/src/lib/validations';
import { HOME_BY_ROLE, useAuth } from '@/src/context/AuthContext';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setSubmitting(true);

    const result = await login(values.email, values.password);

    if (!result.ok) {
      setServerError(result.error ?? 'Credenciales invalidas.');
      setSubmitting(false);
      return;
    }

    const home = (result.role && HOME_BY_ROLE[result.role]) || '/';
    router.replace(home);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 font-secondary text-sm text-red-800"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Input
        label="Correo electronico"
        type="email"
        autoComplete="email"
        placeholder="nombre@umss.edu.bo"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Contrasena"
        type="password"
        autoComplete="current-password"
        placeholder="********"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting}
        icon={<LogIn size={18} />}
      >
        {submitting ? 'Ingresando...' : 'Iniciar Sesion'}
      </Button>

      <div className="flex items-center justify-center gap-4 pt-2 font-secondary text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Mail size={12} /> correo UMSS
        </span>
        <span className="flex items-center gap-1">
          <Lock size={12} /> contrasena
        </span>
      </div>
    </form>
  );
}
