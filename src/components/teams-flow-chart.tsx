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
import { TeamWithHierarchy } from '@/types/team'
import { Users, Target, Building2 } from 'lucide-react'
import Link from 'next/link'

interface TeamsFlowChartProps {
  teams: TeamWithHierarchy[]
}

// Custom Team Node Component
function TeamNode({ data }: { data: TeamWithHierarchy }) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push(`/teams/${data.id}`)
  }, [data.id, router])

  return (
    <div className='bg-neutral-900/60 border-2 border-neutral-600 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[250px]'>
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
        className='p-4 cursor-pointer hover:bg-neutral-800 transition-colors duration-200'
        onClick={handleClick}
      >
        {/* Header with team name and children count */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Building2 className='w-4 h-4 text-blue-400' />
            <h3 className='font-semibold text-sm text-neutral-100 truncate'>
              {data.name}
            </h3>
          </div>
          {data.children.length > 0 && (
            <span className='bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full font-medium'>
              {data.children.length}
            </span>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <p className='text-xs text-neutral-400 mb-3 line-clamp-2'>
            {data.description}
          </p>
        )}

        {/* Stats */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs text-neutral-500'>
            <Users className='w-3 h-3' />
            <span>
              {data.people.length} member{data.people.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className='flex items-center gap-2 text-xs text-neutral-500'>
            <Target className='w-3 h-3' />
            <span>
              {data.initiatives.length} initiative
              {data.initiatives.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Define custom node types
const nodeTypes: NodeTypes = {
  team: TeamNode,
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
    ranksep: 200, // Increased spacing between levels for better readability
    nodesep: 100, // Increased spacing between nodes at the same level
    edgesep: 40, // Increased spacing between edges
    marginx: 80,
    marginy: 80,
    // Additional options to minimize edge crossings
    align: 'UL', // Align nodes to upper left
    acyclicer: 'greedy', // Use greedy algorithm for cycle removal
  })

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: 270,
      height: 160,
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
      x: nodeWithPosition.x - 135, // Half of node width
      y: nodeWithPosition.y - 80, // Half of node height
    }

    return node
  })

  return { nodes, edges }
}

export function TeamsFlowChart({ teams }: TeamsFlowChartProps) {
  // Convert teams data to React Flow nodes and edges
  const { nodes, edges, containerWidth, containerHeight, topLevelPosition } =
    useMemo(() => {
      const nodeMap = new Map<string, Node>()
      const edgeList: Edge[] = []

      // Recursive function to create nodes for all teams
      const createNodes = (teamList: TeamWithHierarchy[]) => {
        teamList.forEach(team => {
          nodeMap.set(team.id, {
            id: team.id,
            type: 'team',
            position: { x: 0, y: 0 }, // Will be set by Dagre
            data: team,
          })

          // Recursively create nodes for children
          if (team.children.length > 0) {
            createNodes(team.children)
          }
        })
      }

      // Recursive function to create edges
      const createEdges = (teamList: TeamWithHierarchy[]) => {
        teamList.forEach(team => {
          if (team.parentId) {
            const parentNode = nodeMap.get(team.parentId)
            if (parentNode) {
              edgeList.push({
                id: `${team.parentId}-${team.id}`,
                source: team.parentId,
                target: team.id,
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

          // Recursively create edges for children
          if (team.children.length > 0) {
            createEdges(team.children)
          }
        })
      }

      // Create all nodes and edges
      createNodes(teams)
      createEdges(teams)

      // Apply Dagre layout
      const initialNodes = Array.from(nodeMap.values())
      const { nodes: layoutedNodes } = getLayoutedElements(
        initialNodes,
        edgeList
      )

      // Find the top-level team (root of hierarchy)
      const topLevelTeam = layoutedNodes.find(node => {
        const team = node.data as TeamWithHierarchy
        return !team.parentId // No parent means this is the top-level team
      })

      // Calculate container dimensions based on the layout
      const maxX = Math.max(...layoutedNodes.map(node => node.position.x))
      const maxY = Math.max(...layoutedNodes.map(node => node.position.y))
      const minX = Math.min(...layoutedNodes.map(node => node.position.x))
      const minY = Math.min(...layoutedNodes.map(node => node.position.y))

      // Calculate the actual chart dimensions
      const chartWidth = maxX - minX + 270 // Add node width
      const chartHeight = maxY - minY + 160 // Add node height

      // Set container dimensions to fit the chart with some padding
      const calculatedWidth = Math.max(800, chartWidth + 100)
      const calculatedHeight = Math.max(500, chartHeight + 100)

      // Calculate viewport to center on top-level team
      const topLevelPosition = topLevelTeam
        ? {
            x: topLevelTeam.position.x + 135, // Center horizontally on node
            y: topLevelTeam.position.y + 80, // Center vertically on node
          }
        : { x: 0, y: 0 }

      return {
        nodes: layoutedNodes,
        edges: edgeList,
        containerWidth: calculatedWidth,
        containerHeight: calculatedHeight,
        topLevelPosition,
      }
    }, [teams])

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )

  // Update nodes when teams data changes
  React.useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  if (teams.length === 0) {
    return (
      <div className='text-neutral-400 text-sm text-center py-12'>
        No teams yet.{' '}
        <Link href='/teams/new' className='text-blue-400 hover:text-blue-300'>
          Create your first team
        </Link>
        .
      </div>
    )
  }

  return (
    <div
      className='border border-neutral-800 rounded-lg overflow-hidden'
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
        <MiniMap
          className='bg-neutral-800 border border-neutral-700'
          nodeColor={node => {
            switch (node.type) {
              case 'team':
                return '#3b82f6' // blue-500
              default:
                return '#6b7280' // neutral-500
            }
          }}
          nodeStrokeWidth={2}
          nodeStrokeColor='#374151' // neutral-700
          maskColor='rgba(0, 0, 0, 0.1)'
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}
