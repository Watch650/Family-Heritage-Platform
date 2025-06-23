export function calculateAge(birthDate: Date | null, deathDate?: Date | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const endDate = deathDate ? new Date(deathDate) : new Date();
  let age = endDate.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    endDate.getMonth() > birth.getMonth() ||
    (endDate.getMonth() === birth.getMonth() && endDate.getDate() >= birth.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

export function formatDateRange(birthDate: Date | null, deathDate: Date | null) {
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : "?";
  const deathYear = deathDate
    ? new Date(deathDate).getFullYear()
    : birthDate
    ? "present"
    : "?";
  return `${birthYear} - ${deathYear}`;
}
