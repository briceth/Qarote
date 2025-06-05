
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MessageSquare, Users, Clock, Database } from "lucide-react";

interface QueueData {
  name: string;
  messages: number;
  consumers: number;
  status: string;
  messagesReady: number;
  messagesUnacked: number;
  messageRate: number;
  consumerUtilisation: number;
  memory: number;
  vhost: string;
  durability: string;
  autoDelete: boolean;
}

const Queues = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const queues: QueueData[] = [
    {
      name: "user-notifications",
      messages: 1200,
      consumers: 3,
      status: "running",
      messagesReady: 850,
      messagesUnacked: 350,
      messageRate: 45.2,
      consumerUtilisation: 85,
      memory: 2.4,
      vhost: "/",
      durability: "durable",
      autoDelete: false
    },
    {
      name: "email-queue",
      messages: 845,
      consumers: 2,
      status: "running",
      messagesReady: 600,
      messagesUnacked: 245,
      messageRate: 32.1,
      consumerUtilisation: 92,
      memory: 1.8,
      vhost: "/",
      durability: "durable",
      autoDelete: false
    },
    {
      name: "analytics-events",
      messages: 2800,
      consumers: 5,
      status: "running",
      messagesReady: 2100,
      messagesUnacked: 700,
      messageRate: 78.5,
      consumerUtilisation: 76,
      memory: 4.2,
      vhost: "/production",
      durability: "durable",
      autoDelete: false
    },
    {
      name: "payment-processing",
      messages: 156,
      consumers: 1,
      status: "running",
      messagesReady: 120,
      messagesUnacked: 36,
      messageRate: 12.3,
      consumerUtilisation: 100,
      memory: 0.8,
      vhost: "/",
      durability: "durable",
      autoDelete: false
    },
    {
      name: "temp-logs",
      messages: 0,
      consumers: 0,
      status: "idle",
      messagesReady: 0,
      messagesUnacked: 0,
      messageRate: 0,
      consumerUtilisation: 0,
      memory: 0.1,
      vhost: "/dev",
      durability: "transient",
      autoDelete: true
    }
  ];

  const filteredQueues = queues.filter(queue =>
    queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    queue.vhost.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-700">Running</Badge>;
      case "idle":
        return <Badge variant="secondary">Idle</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Queue Management
                  </h1>
                  <p className="text-gray-600 mt-1">Manage and monitor all queues across your clusters</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                  <Badge className="ml-2 bg-purple-100 text-purple-700">PRO</Badge>
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Queue
                  <Badge className="ml-2 bg-white/20 text-white">PRO</Badge>
                </Button>
              </div>
            </div>

            {/* Search and Stats */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search queues by name or vhost..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Queues</p>
                        <p className="font-bold text-xl">{queues.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Messages</p>
                        <p className="font-bold text-xl">{queues.reduce((sum, q) => sum + q.messages, 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Queues Table */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">All Queues</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Ready</TableHead>
                      <TableHead>Unacked</TableHead>
                      <TableHead>Consumers</TableHead>
                      <TableHead>Rate (msg/s)</TableHead>
                      <TableHead>Memory (MB)</TableHead>
                      <TableHead>VHost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueues.map((queue) => (
                      <TableRow key={queue.name} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{queue.name}</TableCell>
                        <TableCell>{getStatusBadge(queue.status)}</TableCell>
                        <TableCell className="font-mono">{queue.messages.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-blue-600">{queue.messagesReady.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-orange-600">{queue.messagesUnacked.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            {queue.consumers}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{queue.messageRate.toFixed(1)}</TableCell>
                        <TableCell className="font-mono">{queue.memory.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {queue.vhost}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              Purge
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Queues;
