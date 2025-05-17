import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function CustomNode({ data, isConnectable }: NodeProps) {
  return (
    <div
      className="px-4 py-2 shadow-md rounded-md bg-white border"
      style={{
        borderColor: data.color || "#000000",
        fontFamily: data.fontFamily || "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 border-2" />
      <div className="text-sm font-medium" style={{ color: data.color || "#000000" }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 border-2" />
    </div>
  )
}

export default memo(CustomNode)
