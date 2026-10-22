import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE, type Rol } from "./lib/auth";
import { unauthorized, forbidden } from "./lib/api-response";

const PUBLIC_ROUTES = ["/login", "/register", "/certificado"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/logout", "/api/asistencia/certificado"];

const DEFAULT_HOME: Record<Rol, string> = {
  ADMIN: "/",
  INSTRUCTOR: "/",
  ESTUDIANTE: "/dashboard/estudiante",
};

const ROUTE_ROLES: Record<string, Rol[]> = {
  "/": ["ADMIN", "INSTRUCTOR"],
  "/dashboard/estudiante": ["ESTUDIANTE"],
  "/cursos": ["ADMIN", "INSTRUCTOR"],
  "/inscripciones": ["ADMIN", "INSTRUCTOR"],
  "/asistencia": ["ADMIN", "INSTRUCTOR"],
  "/mis-cursos": ["ADMIN", "INSTRUCTOR"],
  "/instructores": ["ADMIN"],
};

function allowedRoles(pathname: string): Rol[] | null {
  // /api/inscripciones -> /inscripciones (mismas reglas para paginas y API)
  const pagePath = pathname.startsWith("/api")
    ? pathname.slice("/api".length) || "/"
    : pathname;

  if (ROUTE_ROLES[pagePath]) return ROUTE_ROLES[pagePath];

  const prefix = Object.keys(ROUTE_ROLES).find(
    (route) => route !== "/" && pagePath.startsWith(`${route}/`),
  );
  return prefix ? ROUTE_ROLES[prefix] : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");

  const isPublicApi =
    PUBLIC_API.includes(pathname) ||
    pathname.startsWith("/api/asistencia/certificado/");

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // APIs públicas: sin sesión ni verificación de roles.
  if (isPublicApi) {
    return NextResponse.next();
  }

  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (isApi) {
      return unauthorized();
    }
    if (isPublic) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isPublic) {
    return NextResponse.redirect(new URL(DEFAULT_HOME[session.role], request.nextUrl));
  }

  const roles = allowedRoles(pathname);
  if (roles && !roles.includes(session.role)) {
    if (isApi) {
      return forbidden();
    }
    return NextResponse.redirect(new URL(DEFAULT_HOME[session.role], request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
