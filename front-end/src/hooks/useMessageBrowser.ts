import { useState, useEffect, useCallback, useMemo } from "react";
import { useServerContext } from "@/contexts/ServerContext";
import { useQueues } from "@/hooks/useApi";
import { RabbitMQMessage } from "@/lib/api";
import { searchMessages } from "@/components/MessageBrowser/Utils";

// Extended message type with queue name
interface ExtendedMessage extends RabbitMQMessage {
  queueName?: string;
}

interface MessageStats {
  totalMessages: number;
  totalQueues: number;
  avgMessageSize: number;
}

export const useMessageBrowser = () => {
  const { selectedServerId } = useServerContext();
  const [selectedQueue, setSelectedQueue] = useState<string>("all");
  const [messageCount, setMessageCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );
  const [messagesData, setMessagesData] = useState<ExtendedMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageStats, setMessageStats] = useState<MessageStats>({
    totalMessages: 0,
    totalQueues: 0,
    avgMessageSize: 0,
  });

  // Get all queues for the filter dropdown
  const {
    data: queuesData,
    isLoading: queuesLoading,
    refetch: refetchQueues,
  } = useQueues(selectedServerId || "");

  const queues = useMemo(() => queuesData?.queues || [], [queuesData?.queues]);

  // Function to load messages from selected queue(s)
  const loadMessages = useCallback(async () => {
    if (!selectedServerId) return;

    setIsLoadingMessages(true);
    try {
      let allMessages: ExtendedMessage[] = [];

      if (selectedQueue === "all") {
        // Load messages from all queues (limit to prevent overwhelming)
        const queuesToCheck = queues.slice(0, 10);
        const promises = queuesToCheck.map(async (queue) => {
          try {
            const response = await fetch(
              `/api/rabbitmq/${selectedServerId}/queues/${encodeURIComponent(
                queue.name
              )}/messages/browse?count=${Math.ceil(
                messageCount / queuesToCheck.length
              )}`
            );
            if (response.ok) {
              const data = await response.json();
              return (data.messages || []).map((msg: RabbitMQMessage) => ({
                ...msg,
                queueName: queue.name,
              }));
            }
          } catch (error) {
            console.error(`Error loading messages from ${queue.name}:`, error);
          }
          return [];
        });

        const results = await Promise.all(promises);
        allMessages = results.flat();
      } else {
        // Load messages from specific queue
        try {
          const response = await fetch(
            `/api/rabbitmq/${selectedServerId}/queues/${encodeURIComponent(
              selectedQueue
            )}/messages/browse?count=${messageCount}`
          );
          if (response.ok) {
            const data = await response.json();
            allMessages = (data.messages || []).map((msg: RabbitMQMessage) => ({
              ...msg,
              queueName: selectedQueue,
            }));
          }
        } catch (error) {
          console.error(`Error loading messages from ${selectedQueue}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      allMessages.sort((a, b) => {
        const aTime = a.properties?.timestamp || 0;
        const bTime = b.properties?.timestamp || 0;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setMessagesData(allMessages);

      // Calculate stats
      const stats = {
        totalMessages: allMessages.length,
        totalQueues: selectedQueue === "all" ? queues.length : 1,
        avgMessageSize:
          allMessages.length > 0
            ? Math.round(
                allMessages.reduce(
                  (sum, msg) => sum + (msg.payload?.length || 0),
                  0
                ) / allMessages.length
              )
            : 0,
      };
      setMessageStats(stats);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedServerId, selectedQueue, messageCount, queues]);

  useEffect(() => {
    if (selectedServerId && queues.length > 0) {
      loadMessages();
    }
  }, [loadMessages, selectedServerId, queues.length]);

  const toggleMessageExpanded = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  // Enhanced filter messages based on search term
  const filteredMessages = useMemo(() => {
    return searchMessages(messagesData, searchTerm);
  }, [messagesData, searchTerm]);

  return {
    // State
    selectedServerId,
    selectedQueue,
    setSelectedQueue,
    messageCount,
    setMessageCount,
    searchTerm,
    setSearchTerm,
    expandedMessages,
    messagesData,
    isLoadingMessages,
    messageStats,
    queues,
    queuesLoading,
    filteredMessages,

    // Actions
    loadMessages,
    toggleMessageExpanded,
    refetchQueues,
  };
};
