// components/share-tree/ReadOnlySidebar.tsx
import { X, Users } from "lucide-react";
import PersonCard from "@/components/family-tree/PersonCard";
import { PersonWithRelationships } from "@/types/family";

type Props = {
  persons: PersonWithRelationships[];
  onFocus: (person: PersonWithRelationships) => void;
  onView: (person: PersonWithRelationships) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
};

export default function ReadOnlySidebar({
  persons,
  onFocus,
  onView,
  isSidebarOpen,
  setIsSidebarOpen,
}: Props) {
  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <Users size={20} className="mr-2 text-blue-600" /> Family Members
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-100 overflow-y-auto">
          {persons.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onClick={() => onFocus(person)}
              onView={() => onView(person)}
              onDelete={() => {}}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
