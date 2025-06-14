"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Edit, Plus, User, Calendar, Heart, Trash2 } from "lucide-react";
import Image from "next/image";
import { PersonNodeProps } from "@/types/family";

const PersonNode = ({ data }: PersonNodeProps) => {
  const { person, onEdit, onAddChild, onViewProfile, onDelete } = data;

  const calculateAge = (birthDate: Date | null, deathDate?: Date | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const endDate = deathDate ? new Date(deathDate) : new Date();
    const age = endDate.getFullYear() - birth.getFullYear();
    return age;
  };

  const formatDateRange = (birthDate: Date | null, deathDate: Date | null) => {
    const birthYear = birthDate ? new Date(birthDate).getFullYear() : "?";
    const deathYear = deathDate
      ? new Date(deathDate).getFullYear()
      : birthDate
      ? "present"
      : "?";
    return `${birthYear} - ${deathYear}`;
  };

  const age = calculateAge(person.birthDate, person.deathDate);
  const isDeceased = !!person.deathDate;

  return (
    <div className="relative group">
      {/* Input handle (for parent connections) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ top: -8 }}
      />

      {/* Node content */}
      <div
        className={`bg-white border-2 rounded-xl p-4 min-w-[180px] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 ${
          isDeceased
            ? "border-gray-300 bg-gray-50"
            : "border-blue-200 hover:border-blue-300"
        }`}
      >
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-3">
          {/* Profile Image */}
          <div className="relative mb-2">
            {person.photoPath ? (
              <div className="relative w-16 h-16">
                <Image
                  src={`/uploads/${person.photoPath}`}
                  alt={person.firstName}
                  fill
                  className="rounded-full object-cover border-3 border-white shadow-md"
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-3 border-white shadow-md ${
                  isDeceased
                    ? "bg-gray-200"
                    : "bg-gradient-to-br from-blue-100 to-purple-100"
                }`}
              >
                <User
                  size={24}
                  className={isDeceased ? "text-gray-500" : "text-blue-600"}
                />
              </div>
            )}

            {/* Status indicator */}
            {isDeceased && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                <Heart size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="text-center">
            <h3
              className={`font-semibold text-sm leading-tight ${
                isDeceased ? "text-gray-700" : "text-gray-900"
              }`}
            >
              {person.firstName}
            </h3>
            {person.lastName && (
              <h3
                className={`font-semibold text-sm leading-tight ${
                  isDeceased ? "text-gray-700" : "text-gray-900"
                }`}
              >
                {person.lastName}
              </h3>
            )}
          </div>

          {/* Dates and Age */}
          {(person.birthDate || person.deathDate) && (
            <div className="flex items-center space-x-1 mt-1">
              <Calendar size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDateRange(person.birthDate, person.deathDate)}
              </span>
            </div>
          )}

          {age && (
            <div className="text-xs text-gray-500 mt-1">
              {isDeceased ? `Lived ${age} years` : `Age ${age}`}
            </div>
          )}
        </div>

        {/* Action Buttons - Hidden until hover */}
        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onViewProfile}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="View profile"
          >
            <User size={14} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Edit person"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={onAddChild}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            title="Add child"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete person"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Output handle (for child connections) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ bottom: -8 }}
      />
    </div>
  );
};

export default PersonNode;
