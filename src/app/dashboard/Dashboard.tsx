"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Person } from "@prisma/client";
import { Plus, Menu, X, Users, TreePine, AlertTriangle } from "lucide-react";
import { ReactFlowProvider } from "reactflow";

import FamilyTree from "@/components/family-tree/FamilyTree";
import PersonModal from "@/components/forms/PersonModal";
import ProfileModal from "@/components/profiles/ProfileModal";
import PersonCard from "@/components/family-tree/PersonCard";
import ShareModal from "@/components/share-tree/ShareModal";
import type { PersonWithRelationships as FamilyPersonWithRelationships } from "@/types/family";
import { useShareTree } from "@/hooks/useShareTree";

interface PersonFormData {
  firstName: string;
  lastName?: string;
  birthDate?: string;
  deathDate?: string;
  gender?: "male" | "female" | "other" | "";
  notes?: string;
  photoPath?: string;
}

type Props = {
  origin: string;
};

const Dashboard = ({ origin }: Props) => {
  const { data: session } = useSession();
  const [persons, setPersons] = useState<FamilyPersonWithRelationships[]>([]);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [parentId, setParentId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const {
    treeRef,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    handleDownload,
    handleCopyLink,
    reactFlowInstance,
    setReactFlowInstance,
  } = useShareTree(origin);
  useEffect(() => {
    if (session) fetchPersons();
  }, [session]);

  const fetchPersons = async () => {
    try {
      const res = await fetch("/api/persons");
      if (res.ok) setPersons(await res.json());
    } catch (e) {
      console.error("Failed to fetch persons:", e);
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
      const method = editingPerson ? "PUT" : "POST";
      const endpoint = editingPerson
        ? `/api/persons/${editingPerson.id}`
        : "/api/persons";
      const body = editingPerson ? data : { ...data, parentId };
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) fetchPersons();
      setIsPersonModalOpen(false);
    } catch (e) {
      console.error("Failed to save person:", e);
    }
  };

  const handleDeletePerson = (person: Person) => {
    setPersonToDelete(person);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      const res = await fetch(`/api/persons/${personToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPersons();
        setIsDeleteConfirmOpen(false);
        setPersonToDelete(null);
      }
    } catch (e) {
      console.error("Failed to delete person:", e);
    }
  };

  const focusOnPerson = (person: Person) => {
    if (!reactFlowInstance) return;

    const node = reactFlowInstance.getNodes().find((n) => n.id === person.id);
    if (!node) return;

    const pos = node.positionAbsolute ?? node.position;
    const width = node.width ?? 150;
    const height = node.height ?? 100;

    const centerX = pos.x + width / 2;
    const centerY = pos.y + height / 2;

    console.log("Focus center:", { centerX, centerY });

    // Delay ensures view is settled
    setTimeout(() => {
      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: 1.25,
        duration: 800,
      });
    }, 100);
  };

  const generateShareSlug = async () => {
    try {
      if (!persons.length || !persons[0].familyTreeId) {
        console.warn("No tree ID available to share.");
        return;
      }
      const res = await fetch(`/api/trees/${persons[0].familyTreeId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.shareSlug) {
        setShareSlug(data.shareSlug);
      }
    } catch (error) {
      console.error("Failed to generate share slug:", error);
    }
  };

  const shareUrl = shareSlug
    ? `${origin}/share/${shareSlug}`
    : `${origin}/dashboard`; // fallback

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

        <div className="p-4">
          <button
            onClick={() => handleAddPerson()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 mb-4"
          >
            <Plus size={16} /> <span>Add Person</span>
          </button>

          <div className="space-y-2 max-h-100 overflow-y-auto">
            {persons.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => focusOnPerson(person)}
                onView={() => handleViewProfile(person)}
                onDelete={() => handleDeletePerson(person)}
              />
            ))}
          </div>

          <button
            onClick={async () => {
              const treeId = persons[0]?.familyTreeId;
              if (!treeId) {
                console.warn("Tree ID is missing.");
                return;
              }

              if (!shareSlug) {
                await generateShareSlug();
              }

              await openShareModal(treeId);
            }}
            className="w-full bg-purple-600 text-white mt-4 px-4 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2"
          >
            <span>Share Tree</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-600"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Family Tree</h1>
          <div className="w-6" />
        </div>

        <div className="flex-1 relative">
          <ReactFlowProvider>
            <FamilyTree
              persons={persons}
              onAddPerson={handleAddPerson}
              onEditPerson={handleEditPerson}
              onViewProfile={handleViewProfile}
              onDeletePerson={handleDeletePerson}
              onInit={setReactFlowInstance}
              onReloadPersons={fetchPersons}
              treeRef={treeRef}
            />
          </ReactFlowProvider>
        </div>
      </main>

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
        onEdit={() => viewingPerson && handleEditPerson(viewingPerson)}
      />

      <ShareModal
        open={isShareModalOpen}
        onClose={closeShareModal}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
        shareUrl={shareUrl}
      />

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
};

export default Dashboard;
