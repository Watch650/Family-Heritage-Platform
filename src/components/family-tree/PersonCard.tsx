// src/components/family-tree/PersonCard.tsx
import Image from "next/image";
import { Person } from "@prisma/client";
import { Trash2, User } from "lucide-react";

export function PersonCard({
  person,
  onClick,
  onView,
  onDelete,
}: {
  person: Person;
  onClick: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
      <div
        onClick={onClick}
        className="flex items-center space-x-3 flex-1 cursor-pointer"
      >
        {person.photoPath ? (
          <div className="relative w-8 h-8">
            <Image
              src={`/upload/${person.photoPath}`}
              alt={person.firstName}
              fill
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">
              {person.lastName?.charAt(0) || ""}
              {person.firstName.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {person.lastName} {person.firstName}
          </p>
          {person.birthDate && (
            <p className="text-xs text-gray-500">
              b. {new Date(person.birthDate).getFullYear()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={onView}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="View profile"
        >
          <User size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Delete person"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default PersonCard;
