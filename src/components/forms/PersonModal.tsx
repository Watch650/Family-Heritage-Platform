"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, User } from "lucide-react";
import Image from "next/image";
import { PersonModalProps, personSchema, PersonFormData } from "@/types/family";

export default function PersonModal({
  isOpen,
  onClose,
  onSave,
  person,
  title,
}: PersonModalProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    person?.photoPath ? `/upload/${person.photoPath}` : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update photoPreview when person changes
  React.useEffect(() => {
    if (person?.photoPath) {
      setPhotoPreview(`/upload/${person.photoPath}`);
    } else {
      setPhotoPreview(null);
    }
  }, [person]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: person
      ? {
          firstName: person.firstName,
          lastName: person.lastName || "",
          birthDate: person.birthDate
            ? new Date(person.birthDate).toISOString().split("T")[0]
            : "",
          deathDate: person.deathDate
            ? new Date(person.deathDate).toISOString().split("T")[0]
            : "",
          gender: (person.gender?.toLowerCase() || "") as
            | ""
            | "male"
            | "female"
            | "other",
          notes: person.biography || "",
        }
      : {},
  });

  React.useEffect(() => {
    if (isOpen && person) {
      reset({
        firstName: person.firstName,
        lastName: person.lastName || "",
        birthDate: person.birthDate
          ? new Date(person.birthDate).toISOString().split("T")[0]
          : "",
        deathDate: person.deathDate
          ? new Date(person.deathDate).toISOString().split("T")[0]
          : "",
        gender: (person.gender?.toLowerCase() || "") as
          | ""
          | "male"
          | "female"
          | "other",
        notes: person.biography || "",
      });
    } else if (isOpen && !person) {
      reset({
        firstName: "",
        lastName: "",
        birthDate: "",
        deathDate: "",
        gender: "",
        notes: "",
      });
    }
  }, [isOpen, person, reset]);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: PersonFormData) => {
    let photoPath = person?.photoPath || undefined;

    // Upload photo if a new one was selected
    if (photoFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("photo", photoFile);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          photoPath = result.filename;
        }
      } catch (error) {
        console.error("Photo upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    }

    onSave({ ...data, photoPath });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Photo Upload Section */}
          <div className="text-center">
            <div className="mb-4">
              {photoPreview ? (
                <div className="relative w-24 h-24 mx-auto">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto border-4 border-gray-200">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              ref={fileInputRef}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <Upload size={16} />
              <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                {...register("firstName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register("lastName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                {...register("birthDate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Death Date
              </label>
              <input
                type="date"
                {...register("deathDate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              {...register("gender")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this person..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
