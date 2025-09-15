'use client'

import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  NodeTypes,
  Position,
  Handle,
} from 'reactflow'
import 'reactflow/dist/style.css'

interface Person {
  id: string
  name: string
  email: string
  role: string | null
  status: string
  team: { id: string; name: string } | null
  manager: { 
    id: string
    name: string
    email: string
    role: string | null
    status: string
    reports: Array<{ id: string; name: string; email: string; role: string | null; status: string }>
  } | null
  reports: Array<{ id: string; name: string; email: string; role: string | null; status: string }>
  level: number
}

interface OrgChartReactFlowProps {
  people: Person[]
}

// Custom Person Node Component
function PersonNode({ data }: { data: Person }) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push(`/people/${data.id}`)
  }, [data.id, router])

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[200px]">
      {/* Top handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-neutral-400 dark:bg-neutral-500"
      />
      
      {/* Bottom handles for outgoing connections */}
      {data.reports.map((_, index) => (
        <Handle
          key={index}
          type="source"
          position={Position.Bottom}
          id={`${data.id}-${index}`}
          className="w-3 h-3 bg-neutral-400 dark:bg-neutral-500"
          style={{
            left: `${20 + (index * 30)}px`,
          }}
        />
      ))}
      
      {/* Node content */}
      <div 
        className="p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
        onClick={handleClick}
      >
        {/* Header with name and reports count */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {data.name}
          </h3>
          {data.reports.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
              {data.reports.length}
            </span>
          )}
        </div>
        
        {/* Role */}
        {data.role && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 truncate">
            {data.role}
          </p>
        )}
        
        {/* Team */}
        {data.team && (
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1 truncate">
            {data.team.name}
          </p>
        )}
        
        {/* Email */}
        <p className="text-xs text-neutral-400 dark:text-neutral-600 truncate">
          {data.email}
        </p>
        
        {/* Status indicator */}
        <div className="flex items-center justify-end mt-2">
          <div
            className={`w-2 h-2 rounded-full ${
              data.status === 'active' ? 'bg-green-500' :
              data.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

// Define custom node types
const nodeTypes: NodeTypes = {
  person: PersonNode,
}

export function OrgChartReactFlow({ people }: OrgChartReactFlowProps) {
  const router = useRouter()

  // Convert people data to React Flow nodes and edges
  const { nodes, edges, containerHeight } = useMemo(() => {
    const nodeMap = new Map<string, Node>()
    const edgeList: Edge[] = []
    
    // Constants for layout
    const LEVEL_HEIGHT = 200
    const NODE_WIDTH = 220
    const NODE_SPACING = 30
    
    // Group people by level
    const levelGroups = new Map<number, Person[]>()
    people.forEach(person => {
      if (!levelGroups.has(person.level)) {
        levelGroups.set(person.level, [])
      }
      levelGroups.get(person.level)!.push(person)
    })
    
    const maxLevel = Math.max(...people.map(p => p.level))
    
    // Calculate positions for each level
    for (let level = 0; level <= maxLevel; level++) {
      const levelPeople = levelGroups.get(level) || []
      const levelCount = levelPeople.length
      
      // Calculate total width needed for this level
      const totalWidth = (levelCount * NODE_WIDTH) + ((levelCount - 1) * NODE_SPACING)
      const startX = Math.max(50, (800 - totalWidth) / 2) // Center the level with minimum margin
      
      levelPeople.forEach((person, index) => {
        const x = startX + (index * (NODE_WIDTH + NODE_SPACING))
        const y = 50 + (level * LEVEL_HEIGHT)
        
        nodeMap.set(person.id, {
          id: person.id,
          type: 'person',
          position: { x, y },
          data: person,
        })
      })
    }
    
    // Create edges
    people.forEach(person => {
      if (person.manager) {
        const managerNode = nodeMap.get(person.manager.id)
        if (managerNode) {
          edgeList.push({
            id: `${person.manager.id}-${person.id}`,
            source: person.manager.id,
            target: person.id,
            type: 'smoothstep',
            style: {
              stroke: 'currentColor',
              strokeWidth: 2,
            },
            className: 'text-neutral-300 dark:text-neutral-600',
          })
        }
      }
    })
    
    // Calculate container height based on the layout
    const calculatedHeight = Math.max(400, 100 + ((maxLevel + 1) * LEVEL_HEIGHT))
    
    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList,
      containerHeight: calculatedHeight,
    }
  }, [people])

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Update nodes when people data changes
  React.useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  if (people.length === 0) {
    return <div className="text-neutral-400 text-sm">No people yet.</div>
  }

  return (
    <div 
      className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
      style={{ height: `${containerHeight}px` }}
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
        className="bg-neutral-50 dark:bg-neutral-900"
        style={{ height: '100%' }}
      >
        <Controls className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          className="text-neutral-200 dark:text-neutral-800"
        />
      </ReactFlow>
    </div>
  )
}
