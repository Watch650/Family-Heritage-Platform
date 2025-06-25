// src/app/dashboard/page.tsx
import { headers } from "next/headers";
import Dashboard from "./Dashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // Server-side fetch using cookies
  const cookie = cookies().toString(); // Forward auth session cookie
  const res = await fetch(`${origin}/api/persons`, {
    headers: { Cookie: cookie },
    cache: "no-store",
  });

  const initialPersons = await res.json();

  return <Dashboard origin={origin} initialPersons={initialPersons} />;
}
