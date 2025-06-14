import { Person, Relationship } from '@prisma/client'
import { Node } from 'reactflow'

interface PersonWithRelationships extends Person {
  parentRelationships: Relationship[]
}

interface TreeNode {
  person: PersonWithRelationships
  children: TreeNode[]
  x: number
  y: number
  width: number
}

export function calculateTreeLayout(persons: PersonWithRelationships[]): Node[] {
  // Find root nodes (persons without parents)
  const rootPersons = persons.filter(p => p.parentRelationships.length === 0)

  // Build tree structure
  const buildTree = (person: PersonWithRelationships): TreeNode => {
    const children = persons
      .filter(p => p.parentRelationships.some(rel => rel.parentId === person.id))
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