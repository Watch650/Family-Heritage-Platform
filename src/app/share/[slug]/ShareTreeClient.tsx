"use client";

import { useState } from "react";
import ReactFlow, {
  NodeMouseHandler,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import type { ReactFlowInstance } from "reactflow";
import { Menu } from "lucide-react";
import "reactflow/dist/style.css";

import { generateReadOnlyLayout } from "@/lib/generateReadOnlyLayout";
import { PersonWithRelationships, SavedLayout } from "@/types/family";
import { Relationship } from "@prisma/client";
import ProfileModal from "@/components/profiles/ProfileModal";
import PersonNode from "@/components/family-tree/PersonNode";
import ReadOnlySidebar from "@/components/share-tree/ReadOnlySidebar";

const nodeTypes = {
  person: PersonNode,
};

type Props = {
  title: string;
  persons: PersonWithRelationships[];
  relationships: Relationship[];
  layout: SavedLayout;
};

export default function ShareTreeClient({ persons, layout }: Props) {
  const [selectedPerson, setSelectedPerson] =
    useState<PersonWithRelationships | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const { nodes, edges } = generateReadOnlyLayout(persons, layout);

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    const person = persons.find((p) => p.id === node.id);
    if (person) setSelectedPerson(person);
  };

  const focusOnPerson = (person: PersonWithRelationships) => {
    if (!reactFlowInstance) return;
    const node = reactFlowInstance.getNodes().find((n) => n.id === person.id);
    if (!node) return;

    const pos = node.positionAbsolute ?? node.position;
    const centerX = pos.x + (node.width ?? 150) / 2;
    const centerY = pos.y + (node.height ?? 100) / 2;

    setTimeout(() => {
      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: 1.25,
        duration: 800,
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ReadOnlySidebar
        persons={persons}
        onFocus={focusOnPerson}
        onView={setSelectedPerson}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-600"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Family Tree</h1>
          <div className="w-6" />
        </div>

        <div className="flex-1 relative">
          <ReactFlowProvider>
            <div className="w-full h-[80vh] bg-white rounded shadow overflow-hidden">
              <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll
                panOnScroll
                zoomOnPinch
                zoomOnDoubleClick={false}
                panOnDrag
                onInit={setReactFlowInstance}
                onConnect={() => {}}
                onNodesChange={() => {}}
                onEdgesChange={() => {}}
                onNodeClick={handleNodeClick}
              >
                <MiniMap
                  nodeColor={() => "#3b82f6"} // Tailwind blue
                  nodeStrokeWidth={2}
                />
                <Controls position="bottom-right" />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>
      </main>

      {selectedPerson && (
        <ProfileModal
          person={selectedPerson}
          isOpen={true}
          onClose={() => setSelectedPerson(null)}
          onEdit={() => {}}
        />
      )}
    </div>
  );
}
