// utils/layoutStorage.ts
import { Node, Edge } from "reactflow";

export interface SavedNode {
  id: string;
  position: { x: number; y: number };
}

export interface SavedEdge {
  id: string;
  source: string;
  target: string;
}

export interface SavedLayout {
  nodes: SavedNode[];
  edges: SavedEdge[];
}

const STORAGE_KEY = "familyTreeLayout";

export function saveLayout(nodes: Node[], edges: Edge[]) {
  const layout: SavedLayout = {
    nodes: nodes.map((n) => ({ id: n.id, position: n.position })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function loadLayout(): SavedLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { nodes: [], edges: [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}