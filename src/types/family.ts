import { Person, Relationship } from "@prisma/client";
import { z } from "zod";
import { ReactFlowInstance } from "reactflow";

// ----------------------
// Zod Schema
// ----------------------

export const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  notes: z.string().optional(),
});

// ----------------------
// Derived Types
// ----------------------

export type PersonFormData = z.infer<typeof personSchema>;

// Person with related relationships
export interface PersonWithRelationships extends Person {
  relationshipsAsOne: Relationship[];
  relationshipsAsTwo: Relationship[];
}

// Person data extended with photo
export type PersonWithPhoto = PersonFormData & { photoPath?: string };

// ----------------------
// Component Props
// ----------------------

// Person modal (add/edit)
export interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PersonWithPhoto) => void;
  person?: Person | null;
  title: string;
}

// Custom node in ReactFlow
export interface PersonNodeProps {
  data: {
    person: Person;
    onEdit: () => void;
    onAddChild: () => void;
    onViewProfile: () => void;
    onDelete: () => void;
  };
}

// Family tree diagram component
export interface FamilyTreeProps {
  persons: PersonWithRelationships[];
  onAddPerson: (parentId?: string) => void;
  onEditPerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onInit?: (instance: ReactFlowInstance) => void;
  onReloadPersons?: () => void;
}

// Profile modal (view-only)
export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onEdit: () => void;
}