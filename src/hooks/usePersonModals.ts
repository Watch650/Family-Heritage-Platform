// src/hooks/usePersonModals.ts
import { useState } from "react";
import { Person } from "@prisma/client";

export function usePersonModals() {
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [parentId, setParentId] = useState<string | undefined>();

  const openAddModal = (newParentId?: string) => {
    setEditingPerson(null);
    setParentId(newParentId);
    setIsPersonModalOpen(true);
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setParentId(undefined);
    setIsPersonModalOpen(true);
    setIsProfileModalOpen(false);
  };

  const openProfile = (person: Person) => {
    setViewingPerson(person);
    setIsProfileModalOpen(true);
  };

  return {
    isPersonModalOpen,
    setIsPersonModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    editingPerson,
    viewingPerson,
    parentId,
    openAddModal,
    openEditModal,
    openProfile,
  };
}