"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Person } from "@prisma/client";
import FamilyTree from "@/components/family-tree/FamilyTree";
import PersonModal from "@/components/forms/PersonModal";
import ProfileModal from "@/components/profiles/ProfileModal";
import {
  Plus,
  Menu,
  X,
  Users,
  TreePine,
  AlertTriangle,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import { ReactFlowInstance } from "react-flow-renderer";

import type { PersonWithRelationships as FamilyPersonWithRelationships } from "@/types/family";

type PersonWithRelationships = FamilyPersonWithRelationships;

interface PersonFormData {
  firstName: string;
  lastName?: string;
  birthDate?: string;
  deathDate?: string;
  gender?: "male" | "female" | "other" | "";
  notes?: string;
  photoPath?: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [persons, setPersons] = useState<PersonWithRelationships[]>([]);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [parentId, setParentId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (session) {
      fetchPersons();
    }
  }, [session]);

  const fetchPersons = async () => {
    try {
      const response = await fetch("/api/persons");
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      }
    } catch (error) {
      console.error("Failed to fetch persons:", error);
    }
  };

  const handleAddPerson = (newParentId?: string) => {
    setParentId(newParentId);
    setEditingPerson(null);
    setIsPersonModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setParentId(undefined);
    setIsPersonModalOpen(true);
    setIsProfileModalOpen(false);
  };

  const handleViewProfile = (person: Person) => {
    setViewingPerson(person);
    setIsProfileModalOpen(true);
  };

  const handleSavePerson = async (data: PersonFormData) => {
    try {
      if (editingPerson) {
        const response = await fetch(`/api/persons/${editingPerson.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          await fetchPersons();
        }
      } else {
        const response = await fetch("/api/persons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, parentId }),
        });
        if (response.ok) {
          await fetchPersons();
        }
      }
      setIsPersonModalOpen(false);
    } catch (error) {
      console.error("Failed to save person:", error);
    }
  };

  const handleDeletePerson = (person: Person) => {
    setPersonToDelete(person);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;

    try {
      const response = await fetch(`/api/persons/${personToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPersons();
        setIsDeleteConfirmOpen(false);
        setPersonToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete person:", error);
    }
  };

  const focusOnPerson = (person: Person) => {
    if (reactFlowInstance) {
      const node = reactFlowInstance.getNodes().find((n) => n.id === person.id);
      if (node) {
        reactFlowInstance.fitView({
          padding: 0.5,
          duration: 800,
          minZoom: 1.5,
          maxZoom: 1.5,
        });
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <TreePine size={64} className="mx-auto text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Tree</h1>
          <p className="text-gray-600">
            Please sign in to view your family tree.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <Users size={20} className="mr-2 text-blue-600" />
            Family Members
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => handleAddPerson()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 mb-4"
          >
            <Plus size={16} />
            <span>Add Person</span>
          </button>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {persons.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group"
              >
                <div
                  onClick={() => focusOnPerson(person)}
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
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {person.firstName.charAt(0)}
                        {person.lastName?.charAt(0) || ""}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {person.firstName} {person.lastName}
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
                    onClick={() => handleViewProfile(person)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="View profile"
                  >
                    <User size={16} />
                  </button>
                  <button
                    onClick={() => handleDeletePerson(person)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete person"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-600"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Family Tree</h1>
          <div className="w-6" /> {/* Spacer for alignment */}
        </div>

        {/* Tree View */}
        <div className="flex-1 relative">
          <FamilyTree
            persons={persons}
            onAddPerson={handleAddPerson}
            onEditPerson={handleEditPerson}
            onViewProfile={handleViewProfile}
            onDeletePerson={handleDeletePerson}
            onInit={setReactFlowInstance}
          />
        </div>
      </div>

      {/* Modals */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSavePerson}
        person={editingPerson}
        title={editingPerson ? "Edit Person" : "Add Person"}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        person={viewingPerson}
        onEdit={() => {
          if (viewingPerson) {
            handleEditPerson(viewingPerson);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && personToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-xl font-semibold">Delete Person</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {personToDelete.firstName}{" "}
              {personToDelete.lastName}? This action cannot be undone and will
              remove all associated relationships.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setPersonToDelete(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
