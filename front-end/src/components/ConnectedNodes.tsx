
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Wifi, HardDrive, Cpu } from "lucide-react";

interface Node {
  name: string;
  status: "running" | "warning" | "error";
  version: string;
  uptime: string;
  memory: number;
  cpu: number;
  disk: number;
  connections: number;
}

export const ConnectedNodes = () => {
  const nodes: Node[] = [
    {
      name: "rabbit@node-01",
      status: "running",
      version: "3.12.6",
      uptime: "15d 3h 42m",
      memory: 4.2,
      cpu: 23.1,
      disk: 45.8,
      connections: 127
    },
    {
      name: "rabbit@node-02",
      status: "running",
      version: "3.12.6",
      uptime: "15d 3h 41m",
      memory: 3.8,
      cpu: 31.5,
      disk: 52.3,
      connections: 98
    },
    {
      name: "rabbit@node-03",
      status: "warning",
      version: "3.12.6",
      uptime: "2d 8h 12m",
      memory: 7.1,
      cpu: 67.2,
      disk: 78.9,
      connections: 156
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-700">Running</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-700">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-600" />
          Connected Nodes
        </CardTitle>
        <p className="text-sm text-gray-500">Cluster health and node status</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodes.map((node, index) => (
          <div 
            key={node.name}
            className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Server className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{node.name}</h4>
                  <p className="text-xs text-gray-500">v{node.version} • {node.uptime}</p>
                </div>
              </div>
              {getStatusBadge(node.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Memory: {node.memory.toFixed(1)} GB</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">CPU: {node.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Disk: {node.disk.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">{node.connections} connections</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
