import { Person, Relationship } from '@prisma/client'

export class FamilyService {
  static async getPersonsByUser(userId: string): Promise<Person[]> {
    const response = await fetch(`/api/persons?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch persons')
    }
    return response.json()
  }

  static async getPersonById(id: string): Promise<Person> {
    const response = await fetch(`/api/persons/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch person')
    }
    return response.json()
  }

  static async createPerson(data: Partial<Person>): Promise<Person> {
    const response = await fetch('/api/persons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create person')
    }
    return response.json()
  }

  static async updatePerson(id: string, data: Partial<Person>): Promise<Person> {
    const response = await fetch(`/api/persons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to update person')
    }
    return response.json()
  }

  static async deletePerson(id: string): Promise<void> {
    const response = await fetch(`/api/persons/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete person')
    }
  }

  static async getRelationships(personId: string): Promise<Relationship[]> {
    const response = await fetch(`/api/relationships?personId=${personId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch relationships')
    }
    return response.json()
  }

  static async createRelationship(data: Partial<Relationship>): Promise<Relationship> {
    const response = await fetch('/api/relationships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create relationship')
    }
    return response.json()
  }

  static async updateRelationship(id: string, data: Partial<Relationship>): Promise<Relationship> {
    const response = await fetch(`/api/relationships/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to update relationship')
    }
    return response.json()
  }

  static async deleteRelationship(id: string): Promise<void> {
    const response = await fetch(`/api/relationships/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete relationship')
    }
  }
}