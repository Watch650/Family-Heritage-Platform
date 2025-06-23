// lib/generateLayout.ts
import { Node, Edge, MarkerType } from "reactflow";
import { PersonWithRelationships } from "@/types/family";
import { SavedLayout } from "@/utils/LayoutStorage";

export function generateLayout(
  persons: PersonWithRelationships[],
  savedLayout: SavedLayout,
  callbacks: {
    onEditPerson: (p: PersonWithRelationships) => void;
    onAddPerson: (parentId?: string) => void;
    onViewProfile: (p: PersonWithRelationships) => void;
    onDeletePerson: (p: PersonWithRelationships) => void;
  }
): { nodes: Node[]; edges: Edge[] } {
  const generations: { [key: number]: PersonWithRelationships[] } = {};
  const personLevels: { [key: string]: number } = {};

  const calculateLevel = (
    person: PersonWithRelationships,
    visited = new Set<string>()
  ): number => {
    if (visited.has(person.id)) return 0;
    visited.add(person.id);
    const parentRels = person.relationshipsAsTwo?.filter(
      (rel) => rel.type === "PARENT" && rel.personTwoId === person.id
    ) || [];
    if (parentRels.length === 0) return 0;
    const parentLevels = parentRels.map((rel) => {
      const parent = persons.find((p) => p.id === rel.personOneId);
      if (!parent) return 0;
      return calculateLevel(parent, visited) + 1;
    });
    return Math.max(...parentLevels, 0);
  };

  persons.forEach((p) => {
    const level = calculateLevel(p);
    personLevels[p.id] = level;
    generations[level] ??= [];
    generations[level].push(p);
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  Object.entries(generations).forEach(([levelStr, people]) => {
    const level = parseInt(levelStr);
    const startX = -(people.length * 200) / 2;

    people.forEach((person, index) => {
      const saved = savedLayout.nodes.find((n) => n.id === person.id);
      const x = saved?.position.x ?? startX + index * 200 + 100;
      const y = saved?.position.y ?? level * 150;
      nodes.push({
        id: person.id,
        type: "person",
        position: { x, y },
        data: {
          person,
          onEdit: () => callbacks.onEditPerson(person),
          onAddChild: () => callbacks.onAddPerson(person.id),
          onViewProfile: () => callbacks.onViewProfile(person),
          onDelete: () => callbacks.onDeletePerson(person),
        },
      });
    });
  });

  const parentEdges = persons.flatMap((p) =>
    (p.relationshipsAsOne || [])
      .filter((r) => r.type === "PARENT")
      .map((r) => ({
        id: `parent-${r.personOneId}-${r.personTwoId}`,
        source: r.personOneId,
        target: r.personTwoId,
        type: "smoothstep",
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        sourceHandle: "parent-source",
        targetHandle: "child-target",
        markerEnd: { type: MarkerType.Arrow, color: "#3b82f6" },
      }))
  );

  const uniqueMarriagePairs = new Set<string>();

  const marriedEdges = persons.flatMap((p) =>
    (p.relationshipsAsOne || [])
      .filter((r) => {
        const key = [r.personOneId, r.personTwoId].sort().join("-");
        if (uniqueMarriagePairs.has(key)) return false;
        uniqueMarriagePairs.add(key);
        return r.type === "MARRIED";
      })
      .map((r) => ({
        id: `married-${r.personOneId}-${r.personTwoId}`,
        source: r.personOneId,
        target: r.personTwoId,
        sourceHandle: "married-left",
        targetHandle: "married-right",
        type: "smoothstep",
        animated: true,
        style: {
          stroke: "#f59e42",
          strokeWidth: 2,
          strokeDasharray: "6 3",
        },
      }))
  );

  edges.push(...parentEdges, ...marriedEdges);

  return { nodes, edges };
}