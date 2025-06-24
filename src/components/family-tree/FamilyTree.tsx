"use client";

import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import ReactFlow, {
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
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { RelationshipType } from "@prisma/client";
import { useResponsive } from "@/hooks/useResponsive";
import { generateLayout } from "@/lib/generateLayout";
import { FamilyTreeProps } from "@/types/family";
import { loadLayout, saveLayout } from "@/utils/LayoutStorage";
import PersonNode from "@/components/family-tree/PersonNode";

const nodeTypes = { person: PersonNode };

export default function FamilyTree({
  persons,
  onAddPerson,
  onEditPerson,
  onViewProfile,
  onDeletePerson,
  onInit,
  onReloadPersons,
  treeRef,
}: FamilyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pendingRelationships, setPendingRelationships] = useState<
    {
      personOneId: string;
      personTwoId: string;
      type: RelationshipType;
    }[]
  >([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const isMobile = useResponsive();
  const canvasRef = useRef<HTMLDivElement>(null);

  const memoizedLayout = useMemo(() => {
    if (persons.length === 0) return { nodes: [], edges: [] };
    const savedLayout = loadLayout();
    return generateLayout(persons, savedLayout, {
      onEditPerson,
      onAddPerson,
      onViewProfile,
      onDeletePerson,
    });
  }, [persons, onEditPerson, onAddPerson, onViewProfile, onDeletePerson]);

  useEffect(() => {
    setNodes(memoizedLayout.nodes);
    setEdges(memoizedLayout.edges);
    if (treeRef) {
      (treeRef as React.RefObject<HTMLDivElement | null>).current =
        canvasRef.current;
    }
  }, [memoizedLayout, setNodes, setEdges, treeRef]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;

      const handles = [params.sourceHandle, params.targetHandle];
      const isMarriageConnection =
        handles.includes("married-left") && handles.includes("married-right");

      if (isMarriageConnection) {
        const alreadyExists = edges.some(
          (e) =>
            (e.source === params.source && e.target === params.target) ||
            (e.source === params.target && e.target === params.source)
        );
        if (alreadyExists) return;

        const newEdge = {
          ...params,
          type: "straight",
          animated: true,
          style: {
            stroke: "#f59e42",
            strokeWidth: 2,
            strokeDasharray: "6 3",
          },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        setPendingRelationships((prev) => [
          ...prev,
          {
            type: "MARRIED",
            personOneId: params.source!,
            personTwoId: params.target!,
          },
        ]);
        return;
      }

      const isParentChildConnection =
        (params.sourceHandle === "child-target" &&
          params.targetHandle === "parent-source") ||
        (params.sourceHandle === "parent-source" &&
          params.targetHandle === "child-target");

      if (isParentChildConnection) {
        const parentId =
          params.sourceHandle === "parent-source"
            ? params.source!
            : params.target!;
        const childId =
          params.sourceHandle === "child-target"
            ? params.source!
            : params.target!;

        const newEdge = {
          id: `parent-${parentId}-${childId}`,
          source: parentId,
          target: childId,
          sourceHandle: "parent-source",
          targetHandle: "child-target",
          type: "smoothstep",
          markerEnd: { type: MarkerType.Arrow, color: "#3b82f6" },
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        setPendingRelationships((prev) => [
          ...prev,
          {
            type: "PARENT",
            personOneId: parentId,
            personTwoId: childId,
          },
        ]);
      }
    },
    [edges, setEdges]
  );

  const handleSaveLayout = async () => {
    if (nodes.length > 0) {
      saveLayout(nodes, edges);

      for (const rel of pendingRelationships) {
        try {
          await fetch("/api/relationships", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rel),
          });
        } catch (err) {
          console.error("Failed to save relationship:", rel, err);
        }
      }

      setPendingRelationships([]);

      const btn = document.getElementById("save-layout-button");
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = "Saved!";
        btn.classList.add("bg-green-600");
        setTimeout(() => {
          btn.innerHTML = original;
          btn.classList.remove("bg-green-600");
        }, 2000);
      }
    }
  };

  const handleInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    onInit?.(instance);
  };

  const detectRelationshipType = (edge: Edge): RelationshipType => {
    if (
      edge.sourceHandle?.includes("married") ||
      edge.targetHandle?.includes("married") ||
      edge.id.startsWith("married")
    ) {
      return "MARRIED";
    }
    return "PARENT";
  };

  const handleEdgeDelete = async (edge: Edge) => {
    const type = detectRelationshipType(edge);
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    setPendingRelationships((prev) =>
      prev.filter(
        (rel) =>
          !(
            ((rel.personOneId === edge.source &&
              rel.personTwoId === edge.target) ||
              (rel.personOneId === edge.target &&
                rel.personTwoId === edge.source)) &&
            rel.type === type
          )
      )
    );

    try {
      await fetch("/api/relationships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: edge.source,
          target: edge.target,
          type,
        }),
      });

      if (onReloadPersons) {
        onReloadPersons();
      }
    } catch (err) {
      console.error("Failed to delete relationship:", err);
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={canvasRef} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges.map((edge) => ({
            ...edge,
            style: {
              ...(edge.style || {}),
              ...(selectedEdge?.id === edge.id
                ? {
                    stroke: "#f43f5e",
                    strokeWidth: 3,
                    filter: "drop-shadow(0 0 4px #f43f5e)",
                  }
                : {
                    filter: "none",
                  }),
            },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={handleInit}
          onEdgeClick={(_, edge) => setSelectedEdge(edge)}
          onPaneClick={() => setSelectedEdge(null)}
          onNodeClick={() => setSelectedEdge(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Cross}
            gap={30}
            size={4}
            color="#ccc"
          />
        </ReactFlow>
      </div>

      {selectedEdge && (
        <Panel
          position="top-center"
          className="bg-white border shadow rounded px-2 py-1 z-50"
        >
          <button
            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
            onClick={() => {
              handleEdgeDelete(selectedEdge);
              setSelectedEdge(null);
            }}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </Panel>
      )}

      {!isMobile && (
        <>
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            position="bottom-right"
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

      {isMobile && (
        <Panel position="bottom-left">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex space-x-2">
            <button
              onClick={() => reactFlowInstance?.zoomOut()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={() => reactFlowInstance?.zoomIn()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => reactFlowInstance?.fitView({ padding: 0.2 })}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Fit view"
            >
              <Maximize size={20} />
            </button>
            <button
              onClick={() =>
                reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: 1 })
              }
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Reset view"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={handleSaveLayout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Save layout"
            >
              <Save size={20} />
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}