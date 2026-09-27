import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE, type Rol } from "./lib/auth";

const PUBLIC_ROUTES = ["/login", "/register"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/logout"];

const DEFAULT_HOME: Record<Rol, string> = {
  ADMIN: "/",
  INSTRUCTOR: "/",
  ESTUDIANTE: "/dashboard/estudiante",
};

const ROUTE_ROLES: Record<string, Rol[]> = {
  "/": ["ADMIN", "INSTRUCTOR"],
  "/dashboard/estudiante": ["ESTUDIANTE"],
  "/cursos": ["ADMIN", "INSTRUCTOR"],
  "/inscripciones": ["ADMIN"],
  "/asistencia": ["ADMIN", "INSTRUCTOR"],
  "/certificados": ["ADMIN", "INSTRUCTOR"],
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

  if (PUBLIC_API.includes(pathname)) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (isApi) {
      return Response.json({ error: "No autenticado." }, { status: 401 });
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
      return Response.json({ error: "No autorizado." }, { status: 403 });
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
