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
  MiniMap,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import { Person } from '@/types/person'
import { PersonStatusBadge } from './person-status-badge'

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
    <div className='bg-card border-2 border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[200px]'>
      {/* Top handle for incoming connections */}
      <Handle
        type='target'
        position={Position.Top}
        className='w-3 h-3 bg-muted-foreground'
      />

      {/* Bottom handle for outgoing connections */}
      <Handle
        type='source'
        position={Position.Bottom}
        className='w-3 h-3 bg-muted-foreground'
      />

      {/* Node content */}
      <div
        className='p-3 cursor-pointer hover:bg-accent transition-colors duration-200'
        onClick={handleClick}
      >
        {/* Header with name and reports count */}
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-semibold text-sm text-foreground truncate'>
            {data.name}
          </h3>
          {data.reports.length > 0 && (
            <span className='bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-medium'>
              {data.reports.length}
            </span>
          )}
        </div>

        {/* Role */}
        {data.role && (
          <p className='text-xs text-muted-foreground mb-1 truncate'>
            {data.role}
          </p>
        )}

        {/* Team */}
        {data.team && (
          <p className='text-xs text-muted-foreground mb-1 truncate'>
            {data.team.name}
          </p>
        )}

        {/* Email */}
        {data.email && (
          <p className='text-xs text-muted-foreground truncate'>{data.email}</p>
        )}

        {/* Status indicator */}
        <div className='flex items-center justify-end mt-2'>
          <PersonStatusBadge status={data.status} size='sm' />
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
  const { nodes, edges, containerWidth, containerHeight, topLevelPosition } =
    useMemo(() => {
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
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 2,
              },
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
      const { nodes: layoutedNodes } = getLayoutedElements(
        initialNodes,
        edgeList
      )

      // Find the top-level node (root of hierarchy)
      const topLevelNode = layoutedNodes.find(node => {
        const person = node.data as Person
        return !person.manager // No manager means this is the top-level node
      })

      // Calculate container dimensions based on the layout
      const maxX = Math.max(...layoutedNodes.map(node => node.position.x))
      const maxY = Math.max(...layoutedNodes.map(node => node.position.y))
      const minX = Math.min(...layoutedNodes.map(node => node.position.x))
      const minY = Math.min(...layoutedNodes.map(node => node.position.y))

      // Calculate the actual chart dimensions
      const chartWidth = maxX - minX + 220 // Add node width
      const chartHeight = maxY - minY + 120 // Add node height

      // Set container dimensions to fit the chart with some padding
      const calculatedWidth = Math.max(800, chartWidth + 100)
      const calculatedHeight = Math.max(400, chartHeight + 100)

      // Calculate viewport to center on top-level node
      const topLevelPosition = topLevelNode
        ? {
            x: topLevelNode.position.x + 110, // Center horizontally on node
            y: topLevelNode.position.y + 60, // Center vertically on node
          }
        : { x: 0, y: 0 }

      return {
        nodes: layoutedNodes,
        edges: edgeList,
        containerWidth: calculatedWidth,
        containerHeight: calculatedHeight,
        topLevelPosition,
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
    return <div className='text-muted-foreground text-sm'>No people yet.</div>
  }

  return (
    <div
      className='border rounded-lg overflow-hidden'
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        maxWidth: '100%',
        maxHeight: '80vh',
      }}
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        minZoom={0.001}
        maxZoom={10}
        fitView
        fitViewOptions={{
          padding: 0.05,
          includeHiddenNodes: false,
        }}
        defaultViewport={{
          x: -topLevelPosition.x + containerWidth / 2,
          y: -topLevelPosition.y + containerHeight / 2,
          zoom: 0.1,
        }}
        className='bg-background'
        style={{ height: '100%' }}
      >
        <Controls className='bg-card border' />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className='text-muted'
        />
        <MiniMap
          className='bg-card border'
          nodeColor={node => {
            switch (node.type) {
              case 'person':
                return 'hsl(var(--primary))'
              default:
                return 'hsl(var(--muted-foreground))'
            }
          }}
          nodeStrokeWidth={2}
          nodeStrokeColor='hsl(var(--border))'
          maskColor='rgba(0, 0, 0, 0.1)'
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}
