"use client";

import React from "react";
import { Person } from "@prisma/client";
import { X, Calendar, MapPin, FileText, Edit } from "lucide-react";
import Image from "next/image";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onEdit: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  person,
  onEdit,
}: ProfileModalProps) {
  if (!isOpen || !person) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (birthDate: Date | null, deathDate?: Date | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const endDate = deathDate ? new Date(deathDate) : new Date();
    const age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < birth.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  const age = calculateAge(person.birthDate, person.deathDate);
  const isDeceased = !!person.deathDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center space-x-4">
            {/* Profile Image */}
            <div className="relative">
              {person.photoPath ? (
                <div className="relative w-24 h-24">
                  <Image
                    src={`/upload/${person.photoPath}`}
                    alt={person.firstName}
                    fill
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 border-white">
                  <span className="text-white text-2xl font-bold">
                    {person.firstName.charAt(0)}
                    {person.lastName?.charAt(0) || ""}
                  </span>
                </div>
              )}
            </div>

            {/* Name and Basic Info */}
            <div className="text-white">
              <h1 className="text-3xl font-bold">
                {person.firstName} {person.lastName}
              </h1>
              {age && (
                <p className="text-lg opacity-90">
                  {isDeceased ? `Lived ${age} years` : `${age} years old`}
                </p>
              )}
              {person.gender && (
                <p className="text-sm opacity-80 capitalize">
                  {person.gender.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Life Dates */}
          <div className="mb-6">
            <h2 className="text-xl text-black font-semibold mb-3 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Life Timeline
            </h2>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Born
                  </label>
                  <p className="text-gray-900">
                    {formatDate(person.birthDate)}
                  </p>
                </div>

                {person.deathDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Died
                    </label>
                    <p className="text-gray-900">
                      {formatDate(person.deathDate)}
                    </p>
                  </div>
                )}
              </div>

              {age && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {isDeceased
                      ? `Lived for ${age} years`
                      : `Currently ${age} years old`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Birth Place */}
          {person.birthPlace && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center">
                <MapPin className="mr-2 text-red-600" size={20} />
                Birth Place
              </h2>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{person.birthPlace}</p>
              </div>
            </div>
          )}

          {/* Biography */}
          {person.biography && (
            <div className="mb-6">
              <h2 className="text-xl text-black font-semibold mb-3 flex items-center">
                <FileText className="mr-2 text-green-600" size={20} />
                Biography
              </h2>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {person.biography}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
