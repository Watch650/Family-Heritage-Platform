"use client";

import { Handle, Position } from "reactflow";
import { FamilyMember } from "@/hooks/useFamilyTree";
import { Edit, Plus } from "lucide-react";
import Image from "next/image";

interface FamilyMemberNodeProps {
  data: {
    member: FamilyMember;
    onEdit: (member: FamilyMember) => void;
    onAddChild: (member: FamilyMember) => void;
  };
}

export function FamilyMemberNode({ data }: FamilyMemberNodeProps) {
  const { member, onEdit, onAddChild } = data;

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).getFullYear().toString();
  };

  return (
    <div className="relative">
      {/* Input handle (for parent connections) */}
      <Handle type="target" position={Position.Top} />

      {/* Node content */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-w-[160px] shadow-md hover:shadow-lg transition-shadow">
        {/* Profile image or initials */}
        <div className="flex justify-center mb-2">
          {member.photoPath ? (
            <Image
              src={`/uploads/${member.photoPath}`}
              alt={member.firstName}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {getInitials(member.firstName, member.lastName || "")}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center mb-2">
          <div className="font-medium text-gray-900">
            {member.firstName} {member.lastName}
          </div>
          {member.birthDate && (
            <div className="text-xs text-gray-500">
              b. {formatDate(member.birthDate)}
              {member.deathDate && ` - d. ${formatDate(member.deathDate)}`}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => onEdit(member)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit person"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onAddChild(member)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Add child"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Output handle (for child connections) */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
