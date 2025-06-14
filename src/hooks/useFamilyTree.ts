import { useState, useCallback } from 'react'
import { Person, Relationship } from '@prisma/client'
import { FamilyService } from '@/services/family'

export type FamilyMember = Person & {
  relationships: Relationship[]
}

export function useFamilyTree(userId: string) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFamilyMembers = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const persons = await FamilyService.getPersonsByUser(userId)
      const membersWithRelationships = await Promise.all(
        persons.map(async (person) => {
          const relationships = await FamilyService.getRelationships(person.id)
          return {
            ...person,
            relationships,
          }
        })
      )
      setMembers(membersWithRelationships)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family members')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const addMember = useCallback(async (data: Partial<Person>) => {
    try {
      const newPerson = await FamilyService.createPerson(data)
      const relationships = await FamilyService.getRelationships(newPerson.id)
      setMembers((prev) => [...prev, { ...newPerson, relationships }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add family member')
      throw err
    }
  }, [])

  const updateMember = useCallback(async (id: string, data: Partial<Person>) => {
    try {
      const updatedPerson = await FamilyService.updatePerson(id, data)
      const relationships = await FamilyService.getRelationships(id)
      setMembers((prev) =>
        prev.map((member) =>
          member.id === id ? { ...updatedPerson, relationships } : member
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update family member')
      throw err
    }
  }, [])

  const deleteMember = useCallback(async (id: string) => {
    try {
      await FamilyService.deletePerson(id)
      setMembers((prev) => prev.filter((member) => member.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete family member')
      throw err
    }
  }, [])

  return {
    members,
    loading,
    error,
    loadFamilyMembers,
    addMember,
    updateMember,
    deleteMember,
  }
}