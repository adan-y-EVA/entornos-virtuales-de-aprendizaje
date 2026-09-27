import * as z from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Ingresa un correo valido." }).trim(),
  password: z.string().min(1, { error: "La contrasena es obligatoria." }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
