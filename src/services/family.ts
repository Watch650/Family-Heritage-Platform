// src/services/family.ts
import { Person, Relationship } from '@prisma/client';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error ${res.status}: ${res.statusText} - ${error}`);
  }
  return res.json();
}

export class FamilyService {
  // PERSONS
  static getPersonsByUser(userId: string): Promise<Person[]> {
    return request(`/api/persons?userId=${userId}`);
  }

  static getPersonById(id: string): Promise<Person> {
    return request(`/api/persons/${id}`);
  }

  static createPerson(data: Partial<Person>): Promise<Person> {
    return request(`/api/persons`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
  }

  static updatePerson(id: string, data: Partial<Person>): Promise<Person> {
    return request(`/api/persons/${id}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
  }

  static deletePerson(id: string): Promise<void> {
    return request(`/api/persons/${id}`, {
      method: 'DELETE',
    });
  }

  // RELATIONSHIPS
  static getRelationships(personId: string): Promise<Relationship[]> {
    return request(`/api/relationships?personId=${personId}`);
  }

  static createRelationship(data: Partial<Relationship>): Promise<Relationship> {
    return request(`/api/relationships`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
  }

  static updateRelationship(id: string, data: Partial<Relationship>): Promise<Relationship> {
    return request(`/api/relationships/${id}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
  }

  static deleteRelationship(id: string): Promise<void> {
    return request(`/api/relationships/${id}`, {
      method: 'DELETE',
    });
  }
}
