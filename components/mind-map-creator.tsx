"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  type Node,
  addEdge,
  Background,
  Controls,
  type Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from "reactflow"
import "reactflow/dist/style.css"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import { v4 as uuidv4 } from "uuid"
import { Plus, Download, Settings, X, Trash2, Undo, Redo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import CustomNode from "./custom-node"

// Node types definition
const nodeTypes = {
  custom: CustomNode,
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      label: "Main Idea",
      color: "#000000",
      fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    position: { x: 250, y: 100 },
  },
]

// Type for history state
interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

export default function MindMapCreator() {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  )
}

function MindMapContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [nodeName, setNodeName] = useState("")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [bgColor, setBgColor] = useState("#ffffff")
  const [isExporting, setIsExporting] = useState(false)

  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes, edges: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isHistoryAction, setIsHistoryAction] = useState(false)

  // Save current state to history when nodes or edges change
  useEffect(() => {
    if (isHistoryAction) {
      setIsHistoryAction(false)
      return
    }

    // Create a new history entry
    const newHistoryState: HistoryState = {
      nodes: nodes,
      edges: edges,
    }

    // If we're not at the end of history, truncate it
    const newHistory = history.slice(0, historyIndex + 1)

    // Only add to history if something changed
    if (
      JSON.stringify(newHistoryState.nodes) !== JSON.stringify(history[historyIndex].nodes) ||
      JSON.stringify(newHistoryState.edges) !== JSON.stringify(history[historyIndex].edges)
    ) {
      setHistory([...newHistory, newHistoryState])
      setHistoryIndex(newHistory.length)
    }
  }, [nodes, edges])

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsHistoryAction(true)
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]

      setNodes(previousState.nodes)
      setEdges(previousState.edges)
      setHistoryIndex(newIndex)

      // Update selected node if it still exists in the previous state
      if (selectedNode) {
        const nodeStillExists = previousState.nodes.find((node) => node.id === selectedNode.id)
        if (!nodeStillExists) {
          setSelectedNode(null)
        }
      }
    }
  }, [history, historyIndex, setNodes, setEdges, selectedNode])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsHistoryAction(true)
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]

      setNodes(nextState.nodes)
      setEdges(nextState.edges)
      setHistoryIndex(newIndex)

      // Update selected node if it still exists in the next state
      if (selectedNode) {
        const nodeStillExists = nextState.nodes.find((node) => node.id === selectedNode.id)
        if (!nodeStillExists) {
          setSelectedNode(null)
        }
      }
    }
  }, [history, historyIndex, setNodes, setEdges, selectedNode])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo)
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault()
        undo()
      }

      // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
      if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.shiftKey && event.key === "z"))) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [undo, redo])

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: { stroke: "#999", strokeWidth: 1.5 },
            animated: false,
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  // Add a new node
  const addNode = useCallback(() => {
    if (!nodeName.trim()) return

    const newNode: Node = {
      id: uuidv4(),
      type: "custom",
      data: {
        label: nodeName,
        color: "#000000",
        fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
    }

    setNodes((nds) => nds.concat(newNode))
    setNodeName("")
  }, [nodeName, setNodes])

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // Update node properties
  const updateNodeProperty = useCallback(
    (property: string, value: string) => {
      if (!selectedNode) return

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                [property]: value,
              },
            }
          }
          return node
        }),
      )

      // Update the selected node reference
      setSelectedNode((prev) => {
        if (!prev) return null
        return {
          ...prev,
          data: {
            ...prev.data,
            [property]: value,
          },
        }
      })
    },
    [selectedNode, setNodes],
  )

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  // Helper function to prepare for export
  const prepareForExport = useCallback(() => {
    setIsExporting(true)

    // Fit view to ensure all nodes are visible
    setTimeout(() => {
      fitView({ padding: 0.2 })
    }, 50)

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 100)
    })
  }, [fitView])

  // Helper function to clean up after export
  const cleanupAfterExport = useCallback(() => {
    setIsExporting(false)
  }, [])

  // Export as PNG with improved quality
  const exportAsPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return

    await prepareForExport()

    try {
      const flowElement = document.querySelector(".react-flow") as HTMLElement
      if (!flowElement) {
        cleanupAfterExport()
        return
      }

      const dataUrl = await toPng(flowElement, {
        backgroundColor: bgColor,
        quality: 1,
        pixelRatio: 2,
        filter: (node) => {
          // During export, filter out UI controls
          if (isExporting) {
            return (
              !node.classList?.contains("react-flow__controls") &&
              !node.classList?.contains("react-flow__panel") &&
              !node.classList?.contains("react-flow__attribution")
            )
          }
          return true
        },
      })

      // Download the image
      const link = document.createElement("a")
      link.download = "mindmap.png"
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error exporting image:", error)
    } finally {
      cleanupAfterExport()
    }
  }, [bgColor, isExporting, prepareForExport, cleanupAfterExport])

  // Export as PDF with optimized file size
  const exportAsPdf = useCallback(async () => {
    if (!reactFlowWrapper.current) return

    await prepareForExport()

    try {
      const flowElement = document.querySelector(".react-flow") as HTMLElement
      if (!flowElement) {
        cleanupAfterExport()
        return
      }

      // Get dimensions with a reasonable aspect ratio
      const { width, height } = flowElement.getBoundingClientRect()

      // Use standard page sizes and moderate quality settings
      const dataUrl = await toPng(flowElement, {
        backgroundColor: bgColor,
        quality: 0.92, // Standard quality - good balance between quality and file size
        pixelRatio: 1.0, // Standard screen resolution
        filter: (node) => {
          // During export, filter out UI controls
          if (isExporting) {
            return (
              !node.classList?.contains("react-flow__controls") &&
              !node.classList?.contains("react-flow__panel") &&
              !node.classList?.contains("react-flow__attribution")
            )
          }
          return true
        },
      })

      // Use standard A4 size for the PDF
      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      })

      // Calculate dimensions to fit content properly on the page
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Calculate scaling to fit the content while maintaining aspect ratio
      const aspectRatio = width / height
      let imgWidth = pdfWidth - 20 // 10mm margin on each side
      let imgHeight = imgWidth / aspectRatio

      // If height exceeds page, scale down based on height
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20 // 10mm margin on top and bottom
        imgWidth = imgHeight * aspectRatio
      }

      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2
      const y = (pdfHeight - imgHeight) / 2

      // Add the image to the PDF with proper scaling
      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight)
      pdf.save("mindmap.pdf")
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      cleanupAfterExport()
    }
  }, [bgColor, isExporting, prepareForExport, cleanupAfterExport])

  // Add a new function to clear the canvas
  const clearCanvas = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the canvas? This action cannot be undone.")) {
      setNodes([])
      setEdges([])
      setSelectedNode(null)
    }
  }, [setNodes, setEdges])

  return (
    <div className="w-full h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center bg-white">
        <h1 className="text-xl font-semibold">Mind Map Creator</h1>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={undo} variant="outline" size="sm" disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={redo} variant="outline" size="sm" disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button onClick={clearCanvas} variant="outline" size="sm" className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Canvas
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="grid gap-2">
                <Button onClick={exportAsPng} variant="outline" size="sm">
                  Export as PNG
                </Button>
                <Button onClick={exportAsPdf} variant="outline" size="sm">
                  Export as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Customize Mind Map</SheetTitle>
                <SheetDescription>Adjust the appearance of your mind map</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: bgColor }}
          >
            {!isExporting && (
              <>
                <Controls />
                <Background color="#aaa" gap={16} />
                <Panel position="top-left" className="bg-white p-2 rounded-md shadow-md">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={nodeName}
                      onChange={(e) => setNodeName(e.target.value)}
                      placeholder="Node name"
                      className="w-48"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addNode()
                      }}
                    />
                    <Button onClick={addNode} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </Panel>
              </>
            )}
          </ReactFlow>
        </div>

        {selectedNode && !isExporting && (
          <div className="w-72 border-l p-4 bg-white overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Edit Node</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="node-text">Text</Label>
                <Input
                  id="node-text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeProperty("label", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={
                    selectedNode.data.fontFamily || "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif"
                  }
                  onValueChange={(value) => updateNodeProperty("fontFamily", value)}
                >
                  <SelectTrigger id="font-family">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif">
                      SF Pro (System)
                    </SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={selectedNode.data.color || "#000000"}
                    onChange={(e) => updateNodeProperty("color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={selectedNode.data.color || "#000000"}
                    onChange={(e) => updateNodeProperty("color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button variant="destructive" size="sm" onClick={deleteSelectedNode} className="mt-4">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Node
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
