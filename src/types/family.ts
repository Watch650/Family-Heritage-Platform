import { RefObject } from "react";
import { ReactFlowInstance } from "reactflow";
import { Person, Relationship } from "@prisma/client";
import { z } from "zod";

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
    readOnly?: boolean;
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
  treeRef?: RefObject<HTMLDivElement | null>;
}

// Profile modal (view-only)
export interface ProfileModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

// Share modal for exporting family tree (Link, PNG, PDF)
export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  onDownload: (type: "png" | "pdf") => void;
  onCopyLink?: () => void;
  shareUrl: string;
}

// Read-only shared tree data from backend
export interface SharedTreeData {
  title: string;
  persons: PersonWithRelationships[];
  relationships: Relationship[];
  layout: SavedLayout;
}

// Saved layout (backend version of localStorage layout)
export interface SavedNode {
  id: string;
  position: { x: number; y: number };
}

export interface SavedEdge {
  id: string;
  source: string;
  target: string;
}

export interface SavedLayout {
  nodes: SavedNode[];
  edges: SavedEdge[];
}