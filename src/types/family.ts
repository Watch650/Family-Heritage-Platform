import { Person, Relationship } from "@prisma/client";
import { z } from "zod";
import { ReactFlowInstance } from "reactflow";

// Schema for person form data
export const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  notes: z.string().optional(),
});

// Type for person form data
export type PersonFormData = z.infer<typeof personSchema>;

// Extended person type with relationships
export interface PersonWithRelationships extends Person {
  relationshipsAsOne: Relationship[];
  relationshipsAsTwo: Relationship[];
}

// Props for PersonModal component
export interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PersonFormData & { photoPath?: string }) => void;
  person?: Person | null;
  title: string;
}

// Props for PersonNode component
export interface PersonNodeProps {
  data: {
    person: Person;
    onEdit: () => void;
    onAddChild: () => void;
    onViewProfile: () => void;
    onDelete: () => void;
  };
}

// Props for FamilyTree component
export interface FamilyTreeProps {
  persons: PersonWithRelationships[];
  onAddPerson: (parentId?: string) => void;
  onEditPerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onInit?: (instance: ReactFlowInstance) => void;
}

// Props for ProfileModal component
export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onEdit: () => void;
}
