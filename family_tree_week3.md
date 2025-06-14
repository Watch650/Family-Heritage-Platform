# Family Tree App - Week 3: Polish & Features Guide

## Overview
Week 3 transforms your functional family tree into a polished, user-friendly application. Focus on UI/UX improvements, photo uploads, member profiles, and responsive design.

## Prerequisites
- Week 2 completed (React Flow family tree working)
- Users can add/edit family members
- Basic tree visualization is functional

## Day-by-Day Breakdown

### Day 1: Photo Upload System

#### 1. Install File Upload Dependencies
```bash
npm install multer @types/multer
npm install sharp  # For image optimization
```

#### 2. Create Upload API Route (`app/api/upload/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.formData()
    const file: File | null = data.get('photo') as unknown as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}.${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Convert file to buffer and optimize
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Resize and optimize image
    const optimizedBuffer = await sharp(buffer)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Save optimized image
    await writeFile(filepath, optimizedBuffer)

    return NextResponse.json({ 
      filename,
      url: `/uploads/${filename}`
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

#### 3. Enhanced Person Modal with Photo Upload (`components/forms/PersonModal.tsx`)
```typescript
'use client'

import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Person } from '@prisma/client'
import { X, Upload, User } from 'lucide-react'

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
  onSave: (data: PersonFormData & { photoPath?: string }) => void
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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    person?.photoPath ? `/uploads/${person.photoPath}` : null
  )
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFormSubmit = async (data: PersonFormData) => {
    let photoPath = person?.photoPath

    // Upload photo if a new one was selected
    if (photoFile) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('photo', photoFile)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          photoPath = result.filename
        }
      } catch (error) {
        console.error('Photo upload failed:', error)
      } finally {
        setIsUploading(false)
      }
    }

    onSave({ ...data, photoPath })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Photo Upload Section */}
          <div className="text-center">
            <div className="mb-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto border-4 border-gray-200">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              ref={fileInputRef}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <Upload size={16} />
              <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
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
              placeholder="Add any notes about this person..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Save'}
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

### Day 2: Enhanced UI/UX with Tailwind

#### 4. Improved Person Node Design (`components/family-tree/PersonNode.tsx`)
```typescript
'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { Person } from '@prisma/client'
import { Edit, Plus, User, Calendar, Heart } from 'lucide-react'

interface PersonNodeProps {
  data: {
    person: Person
    onEdit: () => void
    onAddChild: () => void
    onViewProfile: () => void
  }
}

export default function PersonNode({ data }: PersonNodeProps) {
  const { person, onEdit, onAddChild, onViewProfile } = data

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const calculateAge = (birthDate: Date | null, deathDate?: Date | null) => {
    if (!birthDate) return null
    const endDate = deathDate || new Date()
    const age = endDate.getFullYear() - birthDate.getFullYear()
    return age
  }

  const formatDateRange = (birthDate: Date | null, deathDate: Date | null) => {
    const birthYear = birthDate ? birthDate.getFullYear() : '?'
    const deathYear = deathDate ? deathDate.getFullYear() : (birthDate ? 'present' : '?')
    return `${birthYear} - ${deathYear}`
  }

  const age = calculateAge(person.birthDate, person.deathDate)
  const isDeceased = !!person.deathDate

  return (
    <div className="relative group">
      {/* Input handle (for parent connections) */}
      <Handle 
        type="target" 
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      {/* Node content */}
      <div className={`bg-white border-2 rounded-xl p-4 min-w-[180px] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 ${
        isDeceased ? 'border-gray-300 bg-gray-50' : 'border-blue-200 hover:border-blue-300'
      }`}>
        
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-3">
          {/* Profile Image */}
          <div className="relative mb-2">
            {person.photoPath ? (
              <img
                src={`/uploads/${person.photoPath}`}
                alt={person.firstName}
                className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-md"
              />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-3 border-white shadow-md ${
                isDeceased ? 'bg-gray-200' : 'bg-gradient-to-br from-blue-100 to-purple-100'
              }`}>
                <User size={24} className={isDeceased ? 'text-gray-500' : 'text-blue-600'} />
              </div>
            )}
            
            {/* Status indicator */}
            {isDeceased && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                <Heart size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="text-center">
            <h3 className={`font-semibold text-sm leading-tight ${
              isDeceased ? 'text-gray-700' : 'text-gray-900'
            }`}>
              {person.firstName}
            </h3>
            {person.lastName && (
              <h3 className={`font-semibold text-sm leading-tight ${
                isDeceased ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {person.lastName}
              </h3>
            )}
          </div>

          {/* Dates and Age */}
          {(person.birthDate || person.deathDate) && (
            <div className="flex items-center space-x-1 mt-1">
              <Calendar size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDateRange(person.birthDate, person.deathDate)}
              </span>
            </div>
          )}
          
          {age && (
            <div className="text-xs text-gray-500 mt-1">
              {isDeceased ? `Lived ${age} years` : `Age ${age}`}
            </div>
          )}
        </div>

        {/* Action Buttons - Hidden until hover */}
        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onViewProfile}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="View profile"
          >
            <User size={14} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Edit person"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={onAddChild}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            title="Add child"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Output handle (for child connections) */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
}
```

### Day 3: Member Profile Pages

#### 5. Create Profile Modal (`components/profiles/ProfileModal.tsx`)
```typescript
'use client'

import React from 'react'
import { Person } from '@prisma/client'
import { X, Calendar, MapPin, FileText, Edit } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  person: Person | null
  onEdit: () => void
}

export default function ProfileModal({ isOpen, onClose, person, onEdit }: ProfileModalProps) {
  if (!isOpen || !person) return null

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (birthDate: Date | null, deathDate?: Date | null) => {
    if (!birthDate) return null
    const endDate = deathDate || new Date()
    const age = endDate.getFullYear() - birthDate.getFullYear()
    const monthDiff = endDate.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const age = calculateAge(person.birthDate, person.deathDate)
  const isDeceased = !!person.deathDate

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Profile Image */}
            <div className="relative">
              {person.photoPath ? (
                <img
                  src={`/uploads/${person.photoPath}`}
                  alt={person.firstName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 border-white">
                  <span className="text-white text-2xl font-bold">
                    {person.firstName.charAt(0)}{person.lastName?.charAt(0) || ''}
                  </span>
                </div>
              )}
            </div>
            
            {/* Name and Basic Info */}
            <div className="text-white">
              <h1 className="text-3xl font-bold">
                {person.firstName} {person.lastName}
              </h1>
              {age && (
                <p className="text-lg opacity-90">
                  {isDeceased ? `Lived ${age} years` : `${age} years old`}
                </p>
              )}
              {person.gender && (
                <p className="text-sm opacity-80 capitalize">
                  {person.gender}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Life Dates */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Life Timeline
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Born
                  </label>
                  <p className="text-gray-900">
                    {formatDate(person.birthDate)}
                  </p>
                </div>
                
                {person.deathDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Died
                    </label>
                    <p className="text-gray-900">
                      {formatDate(person.deathDate)}
                    </p>
                  </div>
                )}
              </div>
              
              {age && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {isDeceased 
                      ? `Lived for ${age} years`
                      : `Currently ${age} years old`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {person.notes && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center">
                <FileText className="mr-2 text-green-600" size={20} />
                Notes
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {person.notes}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Day 4: Responsive Design & Mobile Optimization

#### 6. Enhanced Dashboard Layout (`app/dashboard/page.tsx`)
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Person } from '@prisma/client'
import FamilyTree from '@/components/family-tree/FamilyTree'
import PersonModal from '@/components/forms/PersonModal'
import ProfileModal from '@/components/profiles/ProfileModal'
import { Plus, Menu, X, Users, TreePine } from 'lucide-react'

export default function Dashboard() {
  const { data: session } = useSession()
  const [persons, setPersons] = useState<Person[]>([])
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null)
  const [parentId, setParentId] = useState<string | undefined>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    setIsPersonModalOpen(true)
  }

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person)
    setParentId(undefined)
    setIsPersonModalOpen(true)
    setIsProfileModalOpen(false)
  }

  const handleViewProfile = (person: Person) => {
    setViewingPerson(person)
    setIsProfileModalOpen(true)
  }

  const handleSavePerson = async (data: any) => {
    try {
      if (editingPerson) {
        const response = await fetch(`/api/persons/${editingPerson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          await fetchPersons()
        }
      } else {
        const response = await fetch('/api/persons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, parentId }),
        })
        if (response.ok) {
          await fetchPersons()
        }
      }
      setIsPersonModalOpen(false)
    } catch (error) {
      console.error('Failed to save person:', error)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <TreePine size={64} className="mx-auto text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Tree</h1>
          <p className="text-gray-600">Please sign in to view your family tree.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <Users size={20} className="mr-2 text-blue-600" />
            Family Members
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => handleAddPerson()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 mb-4"
          >
            <Plus size={16} />
            <span>Add Person</span>
          </button>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {persons.map((person) => (
              <div
                key={person.id}
                onClick={() => handleViewProfile(person)}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                {person.photoPath ? (
                  <img
                    src={`/uploads/${person.photoPath}`}
                    alt={person.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {person.firstName