"use client";

import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { useFamilyTree } from "@/hooks/useFamilyTree";
import { dagreLayout } from "@/utils/treeLayout";
import { FamilyMemberNode } from "@/components/family/FamilyMemberNode";
import { useSession } from "next-auth/react";

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

export function FamilyTree() {
  const { data: session } = useSession();
  const { members, loading, error, loadFamilyMembers } = useFamilyTree(
    session?.user?.id || ""
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (session?.user?.id) {
      loadFamilyMembers();
    }
  }, [session?.user?.id, loadFamilyMembers]);

  useEffect(() => {
    if (members.length > 0) {
      const { nodes: layoutNodes, edges: layoutEdges } = dagreLayout(members);
      setNodes(layoutNodes);
      setEdges(layoutEdges);
    }
  }, [members, setNodes, setEdges]);

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    reactFlowInstance.fitView();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <p className="text-gray-500 mb-4">No family members added yet</p>
        <button
          onClick={() => {
            /* TODO: Implement add member dialog */
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add First Family Member
        </button>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
