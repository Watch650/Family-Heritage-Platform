# Family Tree App - Week 2: Core Visualization Guide

## Overview
Week 2 focuses on bringing your family tree to life with React Flow. By the end of this week, you'll have an interactive family tree where users can add, edit, and visualize family relationships.

## Prerequisites
- Week 1 completed (authentication, basic CRUD operations)
- Family members can be created and stored in the database
- User authentication is working

## Day-by-Day Breakdown

### Day 1: React Flow Integration & Basic Setup

#### 1. Install Additional Dependencies
```bash
npm install @types/node
npm install react-resizable-panels  # For better layout
```

#### 2. Create the Family Tree Component (`components/family-tree/FamilyTree.tsx`)
```typescript
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

import PersonNode from './PersonNode'
import { Person } from '@prisma/client'

const nodeTypes = {
  person: PersonNode,
}

interface FamilyTreeProps {
  persons: Person[]
  onAddPerson: (parentId?: string) => void
  onEditPerson: (person: Person) => void
}

export default function FamilyTree({ persons, onAddPerson, onEditPerson }: FamilyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Convert persons to React Flow nodes
  useEffect(() => {
    const treeNodes: Node[] = persons.map((person, index) => ({
      id: person.id,
      type: 'person',
      position: { 
        x: (index % 3) * 200, // Simple grid layout for now
        y: Math.floor(index / 3) * 150 
      },
      data: {
        person,
        onEdit: () => onEditPerson(person),
        onAddChild: () => onAddPerson(person.id),
      },
    }))

    // Create edges for parent-child relationships
    const treeEdges: Edge[] = persons
      .filter(person => person.parentId)
      .map(person => ({
        id: `${person.parentId}-${person.id}`,
        source: person.parentId!,
        target: person.id,
        type: 'smoothstep',
        animated: false,
      }))

    setNodes(treeNodes)
    setEdges(treeEdges)
  }, [persons, onEditPerson, onAddPerson, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  )
}
```

#### 3. Create Person Node Component (`components/family-tree/PersonNode.tsx`)
```typescript
'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { Person } from '@prisma/client'
import { Edit, Plus, User } from 'lucide-react'

interface PersonNodeProps {
  data: {
    person: Person
    onEdit: () => void
    onAddChild: () => void
  }
}

export default function PersonNode({ data }: PersonNodeProps) {
  const { person, onEdit, onAddChild } = data

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).getFullYear().toString()
  }

  return (
    <div className="relative">
      {/* Input handle (for parent connections) */}
      <Handle type="target" position={Position.Top} />
      
      {/* Node content */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-w-[160px] shadow-md hover:shadow-lg transition-shadow">
        {/* Profile image or initials */}
        <div className="flex justify-center mb-2">
          {person.photoPath ? (
            <img
              src={`/uploads/${person.photoPath}`}
              alt={person.firstName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {getInitials(person.firstName, person.lastName)}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center mb-2">
          <div className="font-medium text-gray-900">
            {person.firstName} {person.lastName}
          </div>
          {person.birthDate && (
            <div className="text-xs text-gray-500">
              b. {formatDate(person.birthDate)}
              {person.deathDate && ` - d. ${formatDate(person.deathDate)}`}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit person"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={onAddChild}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Add child"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Output handle (for child connections) */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

### Day 2: Tree Layout Algorithm

#### 4. Improve Tree Layout (`lib/treeLayout.ts`)
```typescript
import { Person } from '@prisma/client'
import { Node } from 'reactflow'

interface TreeNode {
  person: Person
  children: TreeNode[]
  x: number
  y: number
  width: number
}

export function calculateTreeLayout(persons: Person[]): Node[] {
  // Find root nodes (persons without parents)
  const rootPersons = persons.filter(p => !p.parentId)
  
  // Build tree structure
  const buildTree = (person: Person): TreeNode => {
    const children = persons
      .filter(p => p.parentId === person.id)
      .map(buildTree)
    
    return {
      person,
      children,
      x: 0,
      y: 0,
      width: 180, // Node width + spacing
    }
  }

  const trees = rootPersons.map(buildTree)
  
  // Calculate positions using a simple algorithm
  const positionTree = (tree: TreeNode, startX: number, startY: number): void => {
    tree.x = startX
    tree.y = startY
    
    if (tree.children.length === 0) return
    
    const totalWidth = tree.children.length * tree.width
    let currentX = startX - totalWidth / 2 + tree.width / 2
    
    tree.children.forEach(child => {
      positionTree(child, currentX, startY + 150) // 150px vertical spacing
      currentX += tree.width
    })
  }

  // Position each tree
  let currentTreeX = 0
  trees.forEach(tree => {
    positionTree(tree, currentTreeX, 0)
    currentTreeX += getTreeWidth(tree) + 200 // Space between trees
  })

  // Convert to React Flow nodes
  const flattenTree = (tree: TreeNode): Node[] => {
    const node: Node = {
      id: tree.person.id,
      type: 'person',
      position: { x: tree.x, y: tree.y },
      data: { person: tree.person },
    }
    
    const childNodes = tree.children.flatMap(flattenTree)
    return [node, ...childNodes]
  }

  return trees.flatMap(flattenTree)
}

function getTreeWidth(tree: TreeNode): number {
  if (tree.children.length === 0) return tree.width
  return Math.max(tree.width, tree.children.length * tree.width)
}
```

### Day 3: Add/Edit Person Forms

#### 5. Create Person Form Modal (`components/forms/PersonModal.tsx`)
```typescript
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Person } from '@prisma/client'
import { X } from 'lucide-react'

const personSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  notes: z.string().optional(),
})

type PersonFormData = z.infer<typeof personSchema>

interface PersonModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PersonFormData) => void
  person?: Person | null
  title: string
}

export default function PersonModal({ 
  isOpen, 
  onClose, 
  onSave, 
  person, 
  title 
}: PersonModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: person ? {
      firstName: person.firstName,
      lastName: person.lastName || '',
      birthDate: person.birthDate ? person.birthDate.toISOString().split('T')[0] : '',
      deathDate: person.deathDate ? person.deathDate.toISOString().split('T')[0] : '',
      gender: person.gender || '',
      notes: person.notes || '',
    } : {},
  })

  React.useEffect(() => {
    if (isOpen && person) {
      reset({
        firstName: person.firstName,
        lastName: person.lastName || '',
        birthDate: person.birthDate ? person.birthDate.toISOString().split('T')[0] : '',
        deathDate: person.deathDate ? person.deathDate.toISOString().split('T')[0] : '',
        gender: person.gender || '',
        notes: person.notes || '',
      })
    } else if (isOpen && !person) {
      reset({
        firstName: '',
        lastName: '',
        birthDate: '',
        deathDate: '',
        gender: '',
        notes: '',
      })
    }
  }, [isOpen, person, reset])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              {...register('firstName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              {...register('lastName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                {...register('birthDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Death Date
              </label>
              <input
                type="date"
                {...register('deathDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              {...register('gender')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Day 4: API Routes for Person Operations

#### 6. Create API Routes

**Create Person API (`app/api/persons/route.ts`)**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const persons = await prisma.person.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(persons)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch persons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    
    const person = await prisma.person.create({
      data: {
        ...data,
        userId: user.id,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
      }
    })

    return NextResponse.json(person)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
  }
}
```

**Update Person API (`app/api/persons/[id]/route.ts`)**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
      }
    })

    return NextResponse.json(person)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 })
  }
}
```

### Day 5: Main Dashboard Integration

#### 7. Create Main Dashboard (`app/dashboard/page.tsx`)
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Person } from '@prisma/client'
import FamilyTree from '@/components/family-tree/FamilyTree'
import PersonModal from '@/components/forms/PersonModal'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const { data: session } = useSession()
  const [persons, setPersons] = useState<Person[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [parentId, setParentId] = useState<string | undefined>()

  // Fetch persons
  useEffect(() => {
    if (session) {
      fetchPersons()
    }
  }, [session])

  const fetchPersons = async () => {
    try {
      const response = await fetch('/api/persons')
      if (response.ok) {
        const data = await response.json()
        setPersons(data)
      }
    } catch (error) {
      console.error('Failed to fetch persons:', error)
    }
  }

  const handleAddPerson = (newParentId?: string) => {
    setParentId(newParentId)
    setEditingPerson(null)
    setIsModalOpen(true)
  }

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person)
    setParentId(undefined)
    setIsModalOpen(true)
  }

  const handleSavePerson = async (data: any) => {
    try {
      if (editingPerson) {
        // Update existing person
        const response = await fetch(`/api/persons/${editingPerson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          await fetchPersons()
        }
      } else {
        // Create new person
        const response = await fetch('/api/persons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, parentId }),
        })
        if (response.ok) {
          await fetchPersons()
        }
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save person:', error)
    }
  }

  if (!session) {
    return <div>Please sign in to view your family tree.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Family Tree</h1>
          <button
            onClick={() => handleAddPerson()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Family Tree */}
      <div className="flex-1">
        {persons.length > 0 ? (
          <FamilyTree
            persons={persons}
            onAddPerson={handleAddPerson}
            onEditPerson={handleEditPerson}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No family members yet</p>
              <button
                onClick={() => handleAddPerson()}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              >
                Add Your First Family Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Person Modal */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePerson}
        person={editingPerson}
        title={editingPerson ? 'Edit Person' : 'Add Person'}
      />
    </div>
  )
}
```

## Week 2 Testing Checklist

By the end of Week 2, you should be able to:

- [ ] View an interactive family tree with existing family members
- [ ] Add new family members through a modal form
- [ ] Edit existing family members
- [ ] See parent-child relationships as connecting lines
- [ ] Drag nodes around the canvas
- [ ] Use zoom and pan controls
- [ ] Add children to existing family members

## Troubleshooting Tips

**React Flow Not Displaying:**
- Make sure you imported the CSS: `import 'reactflow/dist/style.css'`
- Check that the container has a defined height
- Verify nodes have unique IDs

**Relationships Not Showing:**
- Ensure `parentId` is properly set when creating persons
- Check that edge source/target IDs match node IDs
- Verify the edge creation logic in the `useEffect`

**Forms Not Working:**
- Check that all form fields are properly registered
- Verify API routes are responding correctly
- Use browser dev tools to debug network requests

## Next Week Preview

Week 3 will focus on:
- Photo upload functionality
- Improved UI/UX with better styling
- Member profile pages
- Responsive design for mobile devices
- Better tree layout algorithms

The foundation you build this week is crucial for the visual impact of your family tree app!