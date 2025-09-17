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
import dagre from 'dagre'
import 'reactflow/dist/style.css'

interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  team: { id: string; name: string } | null
  manager: {
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
    reports: Array<{
      id: string
      name: string
      email: string | null
      role: string | null
      status: string
    }>
  } | null
  reports: Array<{
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
  }>
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
    <div className='bg-neutral-900/60 border-2 border-neutral-600 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[200px]'>
      {/* Top handle for incoming connections */}
      <Handle
        type='target'
        position={Position.Top}
        className='w-3 h-3 bg-neutral-500'
      />

      {/* Bottom handle for outgoing connections */}
      <Handle
        type='source'
        position={Position.Bottom}
        className='w-3 h-3 bg-neutral-500'
      />

      {/* Node content */}
      <div
        className='p-3 cursor-pointer hover:bg-neutral-800 transition-colors duration-200'
        onClick={handleClick}
      >
        {/* Header with name and reports count */}
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-semibold text-sm text-neutral-100 truncate'>
            {data.name}
          </h3>
          {data.reports.length > 0 && (
            <span className='bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full font-medium'>
              {data.reports.length}
            </span>
          )}
        </div>

        {/* Role */}
        {data.role && (
          <p className='text-xs text-neutral-400 mb-1 truncate'>{data.role}</p>
        )}

        {/* Team */}
        {data.team && (
          <p className='text-xs text-neutral-500 mb-1 truncate'>
            {data.team.name}
          </p>
        )}

        {/* Email */}
        {data.email && (
          <p className='text-xs text-neutral-600 truncate'>{data.email}</p>
        )}

        {/* Status indicator */}
        <div className='flex items-center justify-end mt-2'>
          <div
            className={`w-2 h-2 rounded-full ${
              data.status === 'active'
                ? 'bg-green-500'
                : data.status === 'inactive'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
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

// Dagre layout configuration
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 180, // Increased spacing between levels for better readability
    nodesep: 80, // Increased spacing between nodes at the same level
    edgesep: 30, // Increased spacing between edges
    marginx: 60,
    marginy: 60,
    // Additional options to minimize edge crossings
    align: 'UL', // Align nodes to upper left
    acyclicer: 'greedy', // Use greedy algorithm for cycle removal
  })

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: 220,
      height: 120,
    })
  })

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Top
    node.sourcePosition = Position.Bottom
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - 110, // Half of node width
      y: nodeWithPosition.y - 60, // Half of node height
    }

    return node
  })

  return { nodes, edges }
}

export function OrgChartReactFlow({ people }: OrgChartReactFlowProps) {
  // Convert people data to React Flow nodes and edges
  const { nodes, edges, containerHeight } = useMemo(() => {
    const nodeMap = new Map<string, Node>()
    const edgeList: Edge[] = []

    // Create nodes for all people
    people.forEach(person => {
      nodeMap.set(person.id, {
        id: person.id,
        type: 'person',
        position: { x: 0, y: 0 }, // Will be set by Dagre
        data: person,
      })
    })

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
            className: 'text-neutral-600',
            animated: false,
            // Add some curvature to avoid overlaps
            pathOptions: {
              borderRadius: 10,
            },
          })
        }
      }
    })

    // Apply Dagre layout
    const initialNodes = Array.from(nodeMap.values())
    const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, edgeList)

    // Calculate container height based on the layout
    const maxY = Math.max(...layoutedNodes.map(node => node.position.y))
    const calculatedHeight = Math.max(400, maxY + 200)

    return {
      nodes: layoutedNodes,
      edges: edgeList,
      containerHeight: calculatedHeight,
    }
  }, [people])

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )

  // Update nodes when people data changes
  React.useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  if (people.length === 0) {
    return <div className='text-neutral-400 text-sm'>No people yet.</div>
  }

  return (
    <div
      className='w-full border border-neutral-800 rounded-lg overflow-hidden'
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
        className='bg-neutral-900'
        style={{ height: '100%' }}
      >
        <Controls className='bg-neutral-800 border border-neutral-700' />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className='text-neutral-800'
        />
      </ReactFlow>
    </div>
  )
}
