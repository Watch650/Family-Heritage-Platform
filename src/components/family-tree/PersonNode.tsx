"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { User, Calendar, Heart, Trash2 } from "lucide-react";
import Image from "next/image";
import { PersonNodeProps } from "@/types/family";
import { calculateAge, formatDateRange } from "@/utils/dateUtils";

const PersonNode = ({ data }: PersonNodeProps) => {
  const { person, onViewProfile, onDelete, readOnly } = data;
  const age = calculateAge(person.birthDate, person.deathDate);
  const isDeceased = !!person.deathDate;

  return (
    <div className="relative group">
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
                  src={`/upload/${person.photoPath}`}
                  alt={person.firstName}
                  fill
                  className="rounded-full object-cover rounded-full border-2 border-white shadow-md"
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 flex items-center justify-center rounded-full border-2 border-white shadow-md ${
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
                isDeceased ? "text-gray-500" : "text-gray-700"
              }`}
            >
              {person.lastName} {person.firstName}
            </h3>
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

          {!readOnly && (
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Delete person"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Top handle (for parent connections) */}
      <Handle
        id="child-target"
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ top: -8 }}
        data-handleid="child-target"
        data-nodeid={person.id}
      />

      {/* Bottom handle (for child connections) */}
      <Handle
        id="parent-source"
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ bottom: -8 }}
        data-handleid="parent-source"
        data-nodeid={person.id}
      />

      {/* Left Handle for MARRIED source */}
      <Handle
        id="married-left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white hover:bg-orange-600 transition-colors"
        style={{ left: -8 }}
        data-handleid="married-left"
        data-nodeid={person.id}
      />

      {/* Right Handle for MARRIED target */}
      <Handle
        id="married-right"
        type="target"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white hover:bg-orange-600 transition-colors"
        style={{ right: -8 }}
        data-handleid="married-right"
        data-nodeid={person.id}
      />
    </div>
  );
};

export default memo(PersonNode);
