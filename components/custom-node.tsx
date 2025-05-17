import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Lightbulb, HelpCircle, AlertCircle, Star, BookOpen, Bookmark, Zap, Briefcase } from "lucide-react"

function CustomNode({ data, isConnectable }: NodeProps) {
  // Map of icon names to components
  const iconMap: Record<string, JSX.Element> = {
    idea: <Lightbulb className="h-4 w-4" />,
    question: <HelpCircle className="h-4 w-4" />,
    important: <AlertCircle className="h-4 w-4" />,
    concept: <BookOpen className="h-4 w-4" />,
    action: <Zap className="h-4 w-4" />,
    resource: <Briefcase className="h-4 w-4" />,
    key: <Star className="h-4 w-4" />,
    reference: <Bookmark className="h-4 w-4" />,
  }

  return (
    <div
      className="px-4 py-2 shadow-md rounded-md bg-white border"
      style={{
        borderColor: data.color || "#000000",
        fontFamily: data.fontFamily || "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 border-2" />
      <div className="flex items-center gap-2">
        {data.icon && iconMap[data.icon] ? (
          <div style={{ color: data.color || "#000000" }}>{iconMap[data.icon]}</div>
        ) : null}
        <div className="text-sm font-medium" style={{ color: data.color || "#000000" }}>
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 border-2" />
    </div>
  )
}

export default memo(CustomNode)
