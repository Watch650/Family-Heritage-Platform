import { Node, Edge } from 'reactflow'
import { FamilyMember } from '@/hooks/useFamilyTree'
import { RelationshipType } from '@prisma/client'

interface TreeNode {
  member: FamilyMember
  children: TreeNode[]
  x: number
  y: number
  width: number
}

export function dagreLayout(members: FamilyMember[]): { nodes: Node[]; edges: Edge[] } {
  // Find root nodes (members without parents)
  const rootMembers = members.filter(m => !m.relationships.some(r => r.type === RelationshipType.BIOLOGICAL_PARENT))

  // Build tree structure
  const buildTree = (member: FamilyMember): TreeNode => {
    const children = members
      .filter(m => m.relationships.some(r =>
        r.type === RelationshipType.BIOLOGICAL_PARENT &&
        r.parentId === member.id
      ))
      .map(buildTree)

    return {
      member,
      children,
      x: 0,
      y: 0,
      width: 180, // Node width + spacing
    }
  }

  const trees = rootMembers.map(buildTree)

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
      id: tree.member.id,
      type: 'familyMember',
      position: { x: tree.x, y: tree.y },
      data: { member: tree.member },
    }

    const childNodes = tree.children.flatMap(flattenTree)
    return [node, ...childNodes]
  }

  // Create edges for parent-child relationships
  const edges: Edge[] = members
    .filter(m => m.relationships.some(r => r.type === RelationshipType.BIOLOGICAL_PARENT))
    .map(member => {
      const parentRelationship = member.relationships.find(r => r.type === RelationshipType.BIOLOGICAL_PARENT)
      if (!parentRelationship) return null

      return {
        id: `${parentRelationship.parentId}-${member.id}`,
        source: parentRelationship.parentId,
        target: member.id,
        type: 'smoothstep',
        animated: false,
      } as Edge
    })
    .filter((edge): edge is Edge => edge !== null)

  return {
    nodes: trees.flatMap(flattenTree),
    edges,
  }
}

function getTreeWidth(tree: TreeNode): number {
  if (tree.children.length === 0) return tree.width
  return Math.max(tree.width, tree.children.length * tree.width)
}