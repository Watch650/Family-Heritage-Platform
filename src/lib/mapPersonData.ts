import { PersonFormData } from "@/types/family";

export function mapPersonData(data: PersonFormData & { photoPath?: string }) {
  const gender = data.gender?.toUpperCase();
  const genderValues = ["MALE", "FEMALE", "OTHER"] as const;

  return {
    firstName: data.firstName,
    lastName: data.lastName || null,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    deathDate: data.deathDate ? new Date(data.deathDate) : null,
    gender: genderValues.includes(gender as typeof genderValues[number])
      ? (gender as "MALE" | "FEMALE" | "OTHER")
      : null,
    biography: data.notes || null,
    photoPath: data.photoPath || null,
  };
}

