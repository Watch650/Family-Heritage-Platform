// src/app/dashboard/page.tsx
import { headers } from "next/headers";
import Dashboard from "./Dashboard";

export default async function DashboardPage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return <Dashboard origin={origin} />;
}
