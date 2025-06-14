"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  MiniMap,
  MarkerType,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { Person } from "@prisma/client";
import PersonNode from "./PersonNode";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  TreePine,
  Save,
} from "lucide-react";
import { FamilyTreeProps } from "@/types/family";

// Extend Person type to include parentId
interface PersonWithParent extends Person {
  parentId?: string | null;
}

interface SavedNode {
  id: string;
  position: { x: number; y: number };
}

interface SavedEdge {
  id: string;
  source: string;
  target: string;
}

interface SavedLayout {
  nodes: SavedNode[];
  edges: SavedEdge[];
}

const nodeTypes = {
  person: PersonNode,
};

export default function FamilyTree({
  persons,
  onAddPerson,
  onEditPerson,
  onViewProfile,
  onDeletePerson,
  onInit,
}: FamilyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Save both node positions and edges when they change
  useEffect(() => {
    if (nodes.length > 0) {
      const layout: SavedLayout = {
        nodes: nodes.map((node) => ({
          id: node.id,
          position: node.position,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };
      localStorage.setItem("familyTreeLayout", JSON.stringify(layout));
    }
  }, [nodes, edges]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Generate nodes and edges from persons data
  useEffect(() => {
    if (persons.length === 0) return;

    const savedLayout = JSON.parse(
      localStorage.getItem("familyTreeLayout") || '{"nodes":[],"edges":[]}'
    ) as SavedLayout;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodePositions: { [key: string]: { x: number; y: number } } = {};

    // Create a map of generations
    const generations: { [key: number]: PersonWithParent[] } = {};
    const personLevels: { [key: string]: number } = {};

    // Calculate generations (simplified - assumes proper parent-child relationships)
    const calculateLevel = (
      person: PersonWithParent,
      visited = new Set()
    ): number => {
      if (visited.has(person.id)) return 0;
      visited.add(person.id);

      if (!person.parentId) return 0;

      const parent = persons.find((p) => p.id === person.parentId);
      if (!parent) return 0;

      return calculateLevel(parent, visited) + 1;
    };

    // First pass: calculate levels and organize by generation
    persons.forEach((person) => {
      const level = calculateLevel(person);
      personLevels[person.id] = level;

      if (!generations[level]) {
        generations[level] = [];
      }
      generations[level].push(person);
    });

    // Second pass: position nodes and create edges
    Object.keys(generations).forEach((levelStr) => {
      const level = parseInt(levelStr);
      const personsInLevel = generations[level];
      const levelWidth = personsInLevel.length * 200;
      const startX = -levelWidth / 2;

      personsInLevel.forEach((person, index) => {
        // Use saved position if available, otherwise calculate new position
        const savedNode = savedLayout.nodes.find((n) => n.id === person.id);
        const x = savedNode ? savedNode.position.x : startX + index * 200 + 100;
        const y = savedNode ? savedNode.position.y : level * 150;

        nodePositions[person.id] = { x, y };

        newNodes.push({
          id: person.id,
          type: "person",
          position: { x, y },
          data: {
            person,
            onEdit: () => onEditPerson(person),
            onAddChild: () => onAddPerson(person.id),
            onViewProfile: () => onViewProfile(person),
            onDelete: () => onDeletePerson(person),
          },
        });
      });
    });

    // Create edges from saved layout or default relationships
    const savedEdges = savedLayout.edges || [];
    const defaultEdges = persons
      .filter((person) => person.parentRelationships.length > 0)
      .map((person) => ({
        id: `${person.parentRelationships[0].parentId}-${person.id}`,
        source: person.parentRelationships[0].parentId,
        target: person.id,
      }));

    // Use saved edges if they exist, otherwise use default edges
    const edgesToCreate = savedEdges.length > 0 ? savedEdges : defaultEdges;

    edgesToCreate.forEach((edge: SavedEdge) => {
      newEdges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#3b82f6",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
        },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    persons,
    onEditPerson,
    onAddPerson,
    onViewProfile,
    onDeletePerson,
    setNodes,
    setEdges,
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Only allow connections from parent to child
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        const sourceLevel = sourceNode.position.y;
        const targetLevel = targetNode.position.y;

        // Only allow connections if target is below source
        if (targetLevel > sourceLevel) {
          setEdges((eds) =>
            addEdge(
              {
                ...params,
                type: "smoothstep",
                animated: false,
                style: { stroke: "#3b82f6", strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "#3b82f6",
                },
              },
              eds
            )
          );
        }
      }
    },
    [nodes, setEdges]
  );

  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };

  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const handleResetView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
    }
  };

  // Update the onInit handler
  const handleInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    onInit?.(instance);
  };

  const handleSaveLayout = () => {
    if (nodes.length > 0) {
      const layout = {
        nodes: nodes.map((node) => ({
          id: node.id,
          position: node.position,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };
      localStorage.setItem("familyTreeLayout", JSON.stringify(layout));

      // Show a temporary success message
      const saveButton = document.getElementById("save-layout-button");
      if (saveButton) {
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = "Saved!";
        saveButton.classList.add("bg-green-600");
        setTimeout(() => {
          saveButton.innerHTML = originalText;
          saveButton.classList.remove("bg-green-600");
        }, 2000);
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e5e7eb"
        />

        {/* Desktop Controls */}
        {!isMobile && (
          <>
            <Controls position="bottom-right" showInteractive={false} />
            <MiniMap
              position="bottom-left"
              nodeColor={(node) =>
                node.data.person.deathDate ? "#9ca3af" : "#3b82f6"
              }
              maskColor="rgb(240, 242, 247, 0.7)"
              pannable
              zoomable
            />
            <Panel position="top-right">
              <button
                id="save-layout-button"
                onClick={handleSaveLayout}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Save Layout</span>
              </button>
            </Panel>
          </>
        )}

        {/* Mobile Controls Panel */}
        {isMobile && (
          <Panel position="bottom-left">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={handleFitView}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Fit view"
              >
                <Maximize size={20} />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Reset view"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={handleSaveLayout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Save layout"
              >
                <Save size={20} />
              </button>
            </div>
          </Panel>
        )}

        {/* Empty State */}
        {persons.length === 0 && (
          <Panel position="top-left">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm">
              <div className="text-gray-400 mb-4">
                <TreePine size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Your Family Tree
              </h3>
              <p className="text-gray-600 mb-4">
                Add your first family member to begin building your tree.
              </p>
              <button
                onClick={() => onAddPerson()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add First Person
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
