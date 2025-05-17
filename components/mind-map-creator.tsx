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
import dagre from "dagre"
import "reactflow/dist/style.css"
import { toPng, toSvg } from "html-to-image"
import { jsPDF } from "jspdf"
import { v4 as uuidv4 } from "uuid"
import {
  Plus,
  Download,
  Settings,
  X,
  Trash2,
  Undo,
  Redo,
  Save,
  FolderOpen,
  Search,
  Layout,
  Palette,
  Lightbulb,
  HelpCircle,
  AlertCircle,
  Star,
  BookOpen,
  Bookmark,
  FileText,
  Zap,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import CustomNode from "./custom-node"

// Node types definition
const nodeTypes = {
  custom: CustomNode,
}

// Initial nodes
const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      label: "Main Idea",
      color: "#000000",
      fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
      template: "default",
    },
    position: { x: 250, y: 100 },
  },
]

// Type for history state
interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

// Type for saved mind map
interface SavedMindMap {
  id: string
  name: string
  date: string
  nodes: Node[]
  edges: Edge[]
  bgColor: string
}

// Node template definitions
const nodeTemplates = [
  {
    id: "default",
    name: "Default",
    color: "#000000",
    icon: <FileText className="h-4 w-4" />,
    description: "Standard node",
  },
  {
    id: "idea",
    name: "Idea",
    color: "#ff9500",
    icon: <Lightbulb className="h-4 w-4" />,
    description: "Creative concepts",
  },
  {
    id: "question",
    name: "Question",
    color: "#007aff",
    icon: <HelpCircle className="h-4 w-4" />,
    description: "Questions to explore",
  },
  {
    id: "important",
    name: "Important",
    color: "#ff3b30",
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Critical information",
  },
  {
    id: "concept",
    name: "Concept",
    color: "#5856d6",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Theoretical concepts",
  },
  {
    id: "action",
    name: "Action",
    color: "#4cd964",
    icon: <Zap className="h-4 w-4" />,
    description: "Tasks and actions",
  },
  {
    id: "resource",
    name: "Resource",
    color: "#5ac8fa",
    icon: <Briefcase className="h-4 w-4" />,
    description: "Resources and materials",
  },
  {
    id: "key",
    name: "Key Point",
    color: "#ffcc00",
    icon: <Star className="h-4 w-4" />,
    description: "Key points and highlights",
  },
  {
    id: "reference",
    name: "Reference",
    color: "#8e8e93",
    icon: <Bookmark className="h-4 w-4" />,
    description: "References and citations",
  },
]

// Theme definitions
const themes = [
  {
    id: "light",
    name: "Light",
    bgColor: "#ffffff",
    nodeColor: "#000000",
    edgeColor: "#999999",
  },
  {
    id: "dark",
    name: "Dark",
    bgColor: "#1a1a1a",
    nodeColor: "#ffffff",
    edgeColor: "#777777",
  },
  {
    id: "blue",
    name: "Blue",
    bgColor: "#f0f8ff",
    nodeColor: "#0055aa",
    edgeColor: "#4477aa",
  },
  {
    id: "green",
    name: "Green",
    bgColor: "#f0fff0",
    nodeColor: "#006600",
    edgeColor: "#448844",
  },
  {
    id: "sepia",
    name: "Sepia",
    bgColor: "#f9f2e8",
    nodeColor: "#704214",
    edgeColor: "#8a6642",
  },
]

// Helper function for auto-layout
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  // Set graph options
  const nodeWidth = 172
  const nodeHeight = 36
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 })

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply layout to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
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
  const { fitView, getNodes, getEdges, setViewport } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [nodeName, setNodeName] = useState("")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [bgColor, setBgColor] = useState("#ffffff")
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Node[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState("default")
  const [savedMindMaps, setSavedMindMaps] = useState<SavedMindMap[]>([])
  const [currentMindMapName, setCurrentMindMapName] = useState("Untitled Mind Map")
  const [selectedTheme, setSelectedTheme] = useState("light")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes, edges: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isHistoryAction, setIsHistoryAction] = useState(false)

  // Load saved mind maps from local storage on initial render
  useEffect(() => {
    const savedMaps = localStorage.getItem("mindMaps")
    if (savedMaps) {
      setSavedMindMaps(JSON.parse(savedMaps))
    }
  }, [])

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

  // Update search results when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      return
    }

    const results = nodes.filter((node) => node.data.label.toLowerCase().includes(searchTerm.toLowerCase()))
    setSearchResults(results)
    setCurrentSearchIndex(0)
  }, [searchTerm, nodes])

  // Apply theme when selected theme changes
  useEffect(() => {
    const theme = themes.find((t) => t.id === selectedTheme)
    if (theme) {
      setBgColor(theme.bgColor)

      // Update node colors based on theme, but preserve template colors
      setNodes((nds) =>
        nds.map((node) => {
          // Only update nodes that don't have a template or have the default template
          if (!node.data.template || node.data.template === "default") {
            return {
              ...node,
              data: {
                ...node.data,
                color: theme.nodeColor,
              },
            }
          }
          return node
        }),
      )

      // Update edge colors
      setEdges((eds) =>
        eds.map((edge) => {
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: theme.edgeColor,
            },
          }
        }),
      )
    }
  }, [selectedTheme])

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

  // Keyboard shortcuts for undo/redo and search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
      }

      // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
      if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.shiftKey && event.key === "z"))) {
        event.preventDefault()
        redo()
      }

      // Check for Ctrl+F (Search)
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault()
        document.getElementById("search-input")?.focus()
      }

      // Check for Ctrl+S (Save)
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault()
        setShowSaveDialog(true)
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
            style: {
              stroke: themes.find((t) => t.id === selectedTheme)?.edgeColor || "#999",
              strokeWidth: 1.5,
            },
            animated: false,
          },
          eds,
        ),
      )
    },
    [setEdges, selectedTheme],
  )

  // Add a new node
  const addNode = useCallback(() => {
    if (!nodeName.trim()) return

    // Find the template
    const template = nodeTemplates.find((t) => t.id === selectedTemplate) || nodeTemplates[0]

    const newNode: Node = {
      id: uuidv4(),
      type: "custom",
      data: {
        label: nodeName,
        color: template.color,
        fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
        template: template.id,
        icon: template.id !== "default" ? template.id : undefined,
      },
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
    }

    setNodes((nds) => nds.concat(newNode))
    setNodeName("")
  }, [nodeName, setNodes, selectedTemplate])

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

  // Change node template
  const changeNodeTemplate = useCallback(
    (templateId: string) => {
      if (!selectedNode) return

      const template = nodeTemplates.find((t) => t.id === templateId) || nodeTemplates[0]

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                color: template.color,
                template: template.id,
                icon: template.id !== "default" ? template.id : undefined,
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
            color: template.color,
            template: template.id,
            icon: template.id !== "default" ? template.id : undefined,
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

  // Auto-layout nodes
  const autoLayout = useCallback(
    (direction = "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(getNodes(), getEdges(), direction)

      setNodes([...layoutedNodes])
      setEdges([...layoutedEdges])

      // Fit view after layout
      setTimeout(() => {
        fitView({ padding: 0.2 })
      }, 50)
    },
    [getNodes, getEdges, setNodes, setEdges, fitView],
  )

  // Save mind map to local storage
  const saveMindMap = useCallback(
    (name: string) => {
      const currentNodes = getNodes()
      const currentEdges = getEdges()

      const mindMap: SavedMindMap = {
        id: uuidv4(),
        name: name,
        date: new Date().toISOString(),
        nodes: currentNodes,
        edges: currentEdges,
        bgColor: bgColor,
      }

      const updatedMindMaps = [...savedMindMaps, mindMap]
      setSavedMindMaps(updatedMindMaps)
      localStorage.setItem("mindMaps", JSON.stringify(updatedMindMaps))
      setCurrentMindMapName(name)
      setShowSaveDialog(false)
    },
    [getNodes, getEdges, savedMindMaps, bgColor],
  )

  // Load mind map from local storage
  const loadMindMap = useCallback(
    (id: string) => {
      const mindMap = savedMindMaps.find((m) => m.id === id)
      if (mindMap) {
        setNodes(mindMap.nodes)
        setEdges(mindMap.edges)
        setBgColor(mindMap.bgColor)
        setCurrentMindMapName(mindMap.name)

        // Reset history
        setHistory([{ nodes: mindMap.nodes, edges: mindMap.edges }])
        setHistoryIndex(0)

        // Fit view after loading
        setTimeout(() => {
          fitView({ padding: 0.2 })
        }, 50)
      }
      setShowLoadDialog(false)
    },
    [savedMindMaps, setNodes, setEdges, fitView],
  )

  // Delete mind map from local storage
  const deleteMindMap = useCallback(
    (id: string) => {
      const updatedMindMaps = savedMindMaps.filter((m) => m.id !== id)
      setSavedMindMaps(updatedMindMaps)
      localStorage.setItem("mindMaps", JSON.stringify(updatedMindMaps))
    },
    [savedMindMaps],
  )

  // Navigate to search result
  const navigateToSearchResult = useCallback(
    (index: number) => {
      if (searchResults.length === 0) return

      const node = searchResults[index]
      if (node) {
        // Center view on the node
        setViewport({ x: -node.position.x + 400, y: -node.position.y + 300, zoom: 1.5 })

        // Select the node
        setSelectedNode(node)
      }
    },
    [searchResults, setViewport],
  )

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
          // During export, filter out UI controls and attribution
          return (
            !node.classList?.contains("react-flow__controls") &&
            !node.classList?.contains("react-flow__panel") &&
            !node.classList?.contains("react-flow__attribution") &&
            !node.classList?.contains("react-flow__minimap")
          )
        },
      })

      // Download the image
      const link = document.createElement("a")
      link.download = `${currentMindMapName.replace(/\s+/g, "-").toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error exporting image:", error)
    } finally {
      cleanupAfterExport()
    }
  }, [bgColor, isExporting, prepareForExport, cleanupAfterExport, currentMindMapName])

  // Export as SVG
  const exportAsSvg = useCallback(async () => {
    if (!reactFlowWrapper.current) return

    await prepareForExport()

    try {
      const flowElement = document.querySelector(".react-flow") as HTMLElement
      if (!flowElement) {
        cleanupAfterExport()
        return
      }

      const dataUrl = await toSvg(flowElement, {
        backgroundColor: bgColor,
        filter: (node) => {
          // During export, filter out UI controls and attribution
          return (
            !node.classList?.contains("react-flow__controls") &&
            !node.classList?.contains("react-flow__panel") &&
            !node.classList?.contains("react-flow__attribution") &&
            !node.classList?.contains("react-flow__minimap")
          )
        },
      })

      // Download the SVG
      const link = document.createElement("a")
      link.download = `${currentMindMapName.replace(/\s+/g, "-").toLowerCase()}.svg`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error exporting SVG:", error)
    } finally {
      cleanupAfterExport()
    }
  }, [bgColor, isExporting, prepareForExport, cleanupAfterExport, currentMindMapName])

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
          // During export, filter out UI controls and attribution
          return (
            !node.classList?.contains("react-flow__controls") &&
            !node.classList?.contains("react-flow__panel") &&
            !node.classList?.contains("react-flow__attribution") &&
            !node.classList?.contains("react-flow__minimap")
          )
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
      pdf.save(`${currentMindMapName.replace(/\s+/g, "-").toLowerCase()}.pdf`)
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      cleanupAfterExport()
    }
  }, [bgColor, isExporting, prepareForExport, cleanupAfterExport, currentMindMapName])

  // Export as JSON
  const exportAsJson = useCallback(() => {
    const data = {
      nodes: getNodes(),
      edges: getEdges(),
      bgColor: bgColor,
      name: currentMindMapName,
    }

    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.download = `${currentMindMapName.replace(/\s+/g, "-").toLowerCase()}.json`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }, [getNodes, getEdges, bgColor, currentMindMapName])

  // Import from JSON
  const importFromJson = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          if (data.nodes && data.edges) {
            setNodes(data.nodes)
            setEdges(data.edges)
            if (data.bgColor) setBgColor(data.bgColor)
            if (data.name) setCurrentMindMapName(data.name)

            // Reset history
            setHistory([{ nodes: data.nodes, edges: data.edges }])
            setHistoryIndex(0)

            // Fit view after loading
            setTimeout(() => {
              fitView({ padding: 0.2 })
            }, 50)
          }
        } catch (error) {
          console.error("Error importing JSON:", error)
          alert("Invalid JSON file. Please try again with a valid mind map file.")
        }
      }
      reader.readAsText(file)

      // Reset the input
      event.target.value = ""
    },
    [setNodes, setEdges, fitView],
  )

  // Add a new function to clear the canvas
  const clearCanvas = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the canvas? This action cannot be undone.")) {
      setNodes([])
      setEdges([])
      setSelectedNode(null)
      setCurrentMindMapName("Untitled Mind Map")
    }
  }, [setNodes, setEdges])

  return (
    <div className="w-full h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Mind Map Creator</h1>
          <Badge variant="outline" className="ml-2">
            {currentMindMapName}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
            <Input
              id="search-input"
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48 h-9"
            />
            {searchResults.length > 0 && (
              <div className="absolute right-2 top-2 flex items-center gap-1 text-xs text-gray-500">
                <span>
                  {currentSearchIndex + 1}/{searchResults.length}
                </span>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      const newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
                      setCurrentSearchIndex(newIndex)
                      navigateToSearchResult(newIndex)
                    }}
                    disabled={searchResults.length <= 1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      const newIndex = (currentSearchIndex + 1) % searchResults.length
                      setCurrentSearchIndex(newIndex)
                      navigateToSearchResult(newIndex)
                    }}
                    disabled={searchResults.length <= 1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>

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

          <Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Layout className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto Layout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-56" align="end">
              <div className="grid gap-2">
                <Button onClick={() => autoLayout("TB")} variant="outline" size="sm">
                  Top to Bottom
                </Button>
                <Button onClick={() => autoLayout("LR")} variant="outline" size="sm">
                  Left to Right
                </Button>
                <Button onClick={() => autoLayout("RL")} variant="outline" size="sm">
                  Right to Left
                </Button>
                <Button onClick={() => autoLayout("BT")} variant="outline" size="sm">
                  Bottom to Top
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setShowSaveDialog(true)} variant="outline" size="sm">
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save (Ctrl+S)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setShowLoadDialog(true)} variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Load</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Themes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-56" align="end">
              <div className="grid gap-2">
                <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                  {themes.map((theme) => (
                    <div key={theme.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} />
                      <Label htmlFor={`theme-${theme.id}`} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: theme.bgColor, borderColor: theme.nodeColor }}
                        ></div>
                        {theme.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </PopoverContent>
          </Popover>

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
                <Button onClick={exportAsSvg} variant="outline" size="sm">
                  Export as SVG
                </Button>
                <Button onClick={exportAsPdf} variant="outline" size="sm">
                  Export as PDF
                </Button>
                <Button onClick={exportAsJson} variant="outline" size="sm">
                  Export as JSON
                </Button>
                <div className="relative">
                  <Button variant="outline" size="sm" className="w-full">
                    Import from JSON
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFromJson}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={clearCanvas} variant="outline" size="sm" className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>

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

                <Separator />

                <div className="grid gap-2">
                  <Label>Themes</Label>
                  <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                    <div className="grid grid-cols-2 gap-2">
                      {themes.map((theme) => (
                        <div key={theme.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={theme.id} id={`theme-sheet-${theme.id}`} />
                          <Label htmlFor={`theme-sheet-${theme.id}`} className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: theme.bgColor, borderColor: theme.nodeColor }}
                            ></div>
                            {theme.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
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
            attributionPosition="none"
          >
            {!isExporting && (
              <>
                <Controls />
                <Background color="#aaa" gap={16} />
                <Panel position="top-left" className="bg-white p-2 rounded-md shadow-md">
                  <div className="flex flex-col gap-2">
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
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">{template.icon}</div>
                              <span style={{ color: template.color }}>{template.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <Label htmlFor="node-template">Template</Label>
                <Select value={selectedNode.data.template || "default"} onValueChange={changeNodeTemplate}>
                  <SelectTrigger id="node-template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0">{template.icon}</div>
                          <span style={{ color: template.color }}>{template.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {nodeTemplates.find((t) => t.id === (selectedNode.data.template || "default"))?.description}
                </p>
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

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Mind Map</DialogTitle>
            <DialogDescription>
              Enter a name for your mind map. It will be saved in your browser's local storage.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Mind Map Name</Label>
              <Input
                id="name"
                value={currentMindMapName}
                onChange={(e) => setCurrentMindMapName(e.target.value)}
                placeholder="My Mind Map"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMindMap(currentMindMapName)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Load Mind Map</DialogTitle>
            <DialogDescription>Select a mind map to load from your saved maps.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {savedMindMaps.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No saved mind maps found.</div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="grid gap-2">
                  {savedMindMaps.map((mindMap) => (
                    <Card key={mindMap.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{mindMap.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete "${mindMap.name}"?`)) {
                                deleteMindMap(mindMap.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription className="text-xs">{new Date(mindMap.date).toLocaleString()}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            {mindMap.nodes.length} nodes, {mindMap.edges.length} connections
                          </div>
                          <Button size="sm" onClick={() => loadMindMap(mindMap.id)}>
                            Load
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
