import { useState, useMemo, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Play, Square, Wifi, WifiOff, Activity } from "lucide-react";
import {
  MessageBrowserHeader,
  MessageFilters,
  MessageList,
  formatPayload,
  getPayloadType,
} from "@/components/MessageBrowser";
import { useMessageStream } from "@/hooks/useMessageStream";
import { useQueues } from "@/hooks/useApi";
import { useServerContext } from "@/contexts/ServerContext";

const MessageBrowser = () => {
  const { selectedServerId } = useServerContext();
  const [selectedQueue, setSelectedQueue] = useState<string>("all");
  const [messageCount, setMessageCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );
  const [isStreamingMode, setIsStreamingMode] = useState(false);

  // Get all queues for the filter dropdown
  const { data: queuesData, isLoading: queuesLoading } =
    useQueues(selectedServerId);

  const queues = useMemo(() => queuesData?.queues || [], [queuesData?.queues]);

  const {
    messages: streamedMessages,
    queueStats,
    isConnected,
    isConnecting,
    error: streamError,
    lastHeartbeat,
    connect,
    disconnect,
    clearMessages: clearStreamedMessages,
  } = useMessageStream({
    queueName: selectedQueue,
    serverId: selectedServerId || "",
    count: messageCount,
    enabled:
      isStreamingMode &&
      !!selectedQueue &&
      !!selectedServerId &&
      selectedQueue !== "all",
  });

  // Search and filter logic for streamed messages
  const filteredStreamedMessages = useMemo(() => {
    if (!searchTerm) return streamedMessages;

    return streamedMessages.filter(
      (msg) =>
        msg.message.payload.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(msg.message.properties)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [streamedMessages, searchTerm]);

  // Convert streamed messages to the format expected by MessageList
  const displayMessages = useMemo(() => {
    return filteredStreamedMessages.map((msg) => ({
      payload: msg.message.payload,
      properties: msg.message.properties,
      routing_key: msg.message.routingKey || "",
      exchange: msg.message.exchange || "",
      message_count: msg.message.messageCount || 0,
      redelivered: msg.message.redelivered || false,
    }));
  }, [filteredStreamedMessages]);

  // Display stats based on streaming mode
  const displayStats = useMemo(() => {
    if (isStreamingMode && queueStats) {
      return {
        totalMessages: queueStats.stats.messages,
        totalQueues: 1,
        avgMessageSize: 0, // We don't have this info from streaming stats
      };
    }

    // When not in streaming mode or no queueStats available, show basic info
    return {
      totalMessages: 0,
      totalQueues: selectedQueue === "all" ? queues.length : 1,
      avgMessageSize: 0,
    };
  }, [isStreamingMode, queueStats, selectedQueue, queues.length]);

  const toggleMessageExpanded = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  if (!selectedServerId) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="text-center py-12">
                <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No Server Selected
                </h2>
                <p className="text-gray-600">
                  Please select a RabbitMQ server to browse messages.
                </p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <MessageBrowserHeader
            messageStats={displayStats}
            selectedQueue={selectedQueue}
          />

          <div className="p-6">
            {/* Streaming Controls */}
            {selectedQueue && selectedQueue !== "all" && (
              <div className="mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isStreamingMode ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                          if (isStreamingMode) {
                            console.log("User stopping message stream");
                            setIsStreamingMode(false);
                            disconnect();
                          } else {
                            console.log("User starting message stream");
                            setIsStreamingMode(true);
                            clearStreamedMessages();
                          }
                        }}
                        disabled={isConnecting}
                        title={
                          isStreamingMode
                            ? "Stop real-time message streaming"
                            : "Start real-time message streaming (may impact performance)"
                        }
                      >
                        {isStreamingMode ? (
                          <>
                            <Square className="h-4 w-4 mr-2" />
                            Stop Stream
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Stream
                          </>
                        )}
                      </Button>

                      {isStreamingMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearStreamedMessages}
                        >
                          Clear Messages
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnecting && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Activity className="h-3 w-3 animate-spin" />
                          Connecting...
                        </Badge>
                      )}

                      {isConnected && (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 bg-green-500"
                        >
                          <Wifi className="h-3 w-3" />
                          Live
                        </Badge>
                      )}

                      {streamError && (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <WifiOff className="h-3 w-3" />
                          Error: {streamError}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {isStreamingMode ? (
                      <span>
                        Streaming from queue: <strong>{selectedQueue}</strong>
                        {lastHeartbeat && (
                          <span className="ml-2 text-xs text-gray-400">
                            Last update:{" "}
                            {new Date(lastHeartbeat).toLocaleTimeString()}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Browse mode - showing static messages</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Active Streaming Status */}
            {selectedQueue && selectedQueue !== "all" && isStreamingMode && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Wifi className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">
                      Live Streaming Active
                    </p>
                    <p className="text-green-700 mt-1">
                      Real-time messages from <strong>{selectedQueue}</strong>{" "}
                      are being streamed. Connection will automatically stop
                      when you navigate away or close this page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Warning for Streaming */}
            {selectedQueue && selectedQueue !== "all" && !isStreamingMode && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Activity className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      Performance Notice
                    </p>
                    <p className="text-yellow-700 mt-1">
                      Real-time message streaming can impact system performance,
                      especially with high message volumes. Use streaming mode
                      for monitoring and debugging purposes only. The stream
                      will automatically stop when you navigate away from this
                      page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info message when "all" queues is selected */}
            {selectedQueue === "all" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Real-time streaming is only available
                  for individual queues. Please select a specific queue to
                  enable live message streaming.
                </p>
              </div>
            )}

            <MessageFilters
              selectedQueue={selectedQueue}
              setSelectedQueue={setSelectedQueue}
              messageCount={messageCount}
              setMessageCount={setMessageCount}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              queues={queues}
              filteredMessagesLength={filteredStreamedMessages.length}
              totalMessagesLength={streamedMessages.length}
              isLoadingMessages={queuesLoading || isConnecting}
            />

            <MessageList
              filteredMessages={displayMessages}
              isLoadingMessages={queuesLoading || isConnecting}
              expandedMessages={expandedMessages}
              onToggleExpanded={toggleMessageExpanded}
              formatPayload={formatPayload}
              getPayloadType={getPayloadType}
              searchTerm={searchTerm}
              selectedQueue={selectedQueue}
              onClearSearch={() => setSearchTerm("")}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MessageBrowser;
