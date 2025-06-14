import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FamilyTree } from "@/components/family/FamilyTree";

export default async function FamilyTreePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Tree</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualize and manage your family relationships
        </p>
      </div>

      <FamilyTree />
    </div>
  );
}
