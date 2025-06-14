import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Search,
  AlertCircle,
  Eye,
  Code,
  FileText,
} from "lucide-react";
import { useBrowseMessages } from "@/hooks/useApi";
import { RabbitMQMessage } from "@/lib/api";

interface MessageBrowserProps {
  queueName: string;
  serverId: string;
}

const MessageBrowser = ({ queueName, serverId }: MessageBrowserProps) => {
  const [count, setCount] = useState(10);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );

  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useBrowseMessages(serverId, queueName, count);

  const toggleMessageExpanded = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  const formatPayload = (payload: string, encoding?: string) => {
    try {
      if (encoding === "base64") {
        const decoded = atob(payload);
        try {
          return JSON.stringify(JSON.parse(decoded), null, 2);
        } catch {
          return decoded;
        }
      }
      // Try to parse as JSON for pretty formatting
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  };

  const getPayloadType = (payload: string, encoding?: string) => {
    try {
      if (encoding === "base64") {
        const decoded = atob(payload);
        try {
          JSON.parse(decoded);
          return "JSON";
        } catch {
          return "Text";
        }
      }
      JSON.parse(payload);
      return "JSON";
    } catch {
      return "Text";
    }
  };

  const renderProperties = (properties: Record<string, unknown>) => {
    return (
      <div className="space-y-2">
        {Object.entries(properties).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {key}
            </Badge>
            <span className="text-sm text-gray-700 font-mono">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderHeaders = (headers: Record<string, unknown>) => {
    return (
      <div className="space-y-2">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {key}
            </Badge>
            <span className="text-sm text-gray-700 font-mono">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Message Browser
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={5}>5 messages</option>
              <option value={10}>10 messages</option>
              <option value={20}>20 messages</option>
              <option value={50}>50 messages</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Failed to load messages: {error.message}
            </AlertDescription>
          </Alert>
        ) : messagesData?.messages && messagesData.messages.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4" />
              Showing {messagesData.messages.length} messages
            </div>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {messagesData.messages.map((message, index) => {
                  const isExpanded = expandedMessages.has(index);
                  const payloadType = getPayloadType(
                    message.payload,
                    message.payload_encoding
                  );

                  return (
                    <Collapsible
                      key={index}
                      open={isExpanded}
                      onOpenChange={() => toggleMessageExpanded(index)}
                    >
                      <div className="border rounded-lg bg-white">
                        <CollapsibleTrigger className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <Badge
                                  variant={
                                    payloadType === "JSON"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {payloadType}
                                </Badge>
                                {message.properties?.content_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {message.properties.content_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>
                                {message.payload.length > 100
                                  ? `${message.payload.substring(0, 100)}...`
                                  : message.payload}
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t">
                            <Tabs defaultValue="payload" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger
                                  value="payload"
                                  className="flex items-center gap-2"
                                >
                                  <Code className="w-4 h-4" />
                                  Payload
                                </TabsTrigger>
                                <TabsTrigger
                                  value="properties"
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="w-4 h-4" />
                                  Properties
                                </TabsTrigger>
                                <TabsTrigger
                                  value="headers"
                                  className="flex items-center gap-2"
                                >
                                  <Search className="w-4 h-4" />
                                  Headers
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="payload" className="mt-4 p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Encoding:{" "}
                                      {message.payload_encoding || "string"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Size: {message.payload.length} bytes
                                    </Badge>
                                  </div>
                                  <ScrollArea className="h-64 w-full">
                                    <pre className="text-sm font-mono bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                                      {formatPayload(
                                        message.payload,
                                        message.payload_encoding
                                      )}
                                    </pre>
                                  </ScrollArea>
                                </div>
                              </TabsContent>
                              <TabsContent
                                value="properties"
                                className="mt-4 p-4"
                              >
                                {message.properties &&
                                Object.keys(message.properties).length > 0 ? (
                                  <ScrollArea className="h-64 w-full">
                                    {renderProperties(message.properties)}
                                  </ScrollArea>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    No properties available
                                  </div>
                                )}
                              </TabsContent>
                              <TabsContent value="headers" className="mt-4 p-4">
                                {message.properties?.headers &&
                                Object.keys(message.properties.headers).length >
                                  0 ? (
                                  <ScrollArea className="h-64 w-full">
                                    {renderHeaders(message.properties.headers)}
                                  </ScrollArea>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    No headers available
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Messages Found
            </h3>
            <p className="text-gray-600 mb-4">
              This queue doesn't have any messages to browse.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageBrowser;
