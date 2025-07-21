import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

// Define feedback type
interface Feedback {
  id: string;
  workspaceId: string;
  workspaceName: string;
  userId: string;
  userEmail: string;
  content: string;
  status: "pending" | "resolved";
  createdAt: string;
}

// Define response type
interface Response {
  id: string;
  content: string;
  createdAt: string;
}

const FeedbackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Response[]>([]);
  const [newResponse, setNewResponse] = useState("");

  // Mock feedback data (would come from API in production)
  const mockFeedback: Record<string, Feedback> = {
    "1": {
      id: "1",
      workspaceId: "ws-1",
      workspaceName: "TechCorp",
      userId: "user-1",
      userEmail: "john@techcorp.com",
      content:
        "Having issues connecting to RabbitMQ cluster. Getting connection refused errors after recent system update. Have tried restarting the service but issue persists.",
      status: "pending",
      createdAt: "2025-06-18T10:30:00Z",
    },
    "2": {
      id: "2",
      workspaceId: "ws-2",
      workspaceName: "DevTeam",
      userId: "user-2",
      userEmail: "sarah@devteam.com",
      content:
        "Need help with message routing configuration. We're trying to set up topic-based routing but messages aren't being delivered to the correct queues.",
      status: "resolved",
      createdAt: "2025-06-17T14:15:00Z",
    },
    "3": {
      id: "3",
      workspaceId: "ws-1",
      workspaceName: "TechCorp",
      userId: "user-3",
      userEmail: "mike@techcorp.com",
      content:
        "Would like to request additional queue features, particularly dead letter exchanges and TTL support for our production environment.",
      status: "pending",
      createdAt: "2025-06-16T09:45:00Z",
    },
    "4": {
      id: "4",
      workspaceId: "ws-3",
      workspaceName: "CloudSys",
      userId: "user-4",
      userEmail: "alex@cloudsys.com",
      content:
        "SSL certificate issue with RabbitMQ connection. Getting certificate validation errors when trying to connect with TLS.",
      status: "resolved",
      createdAt: "2025-06-15T16:20:00Z",
    },
    "5": {
      id: "5",
      workspaceId: "ws-4",
      workspaceName: "FinTech",
      userId: "user-5",
      userEmail: "lisa@fintech.com",
      content:
        "Need help with message persistence settings. We need to ensure our messages are durable even if RabbitMQ restarts.",
      status: "pending",
      createdAt: "2025-06-14T11:10:00Z",
    },
  };

  // Mock responses data
  const mockResponses: Record<string, Response[]> = {
    "2": [
      {
        id: "r-1",
        content:
          'I\'ve checked your routing configuration and found the issue. Your binding key pattern has a syntax error. Please update it to "orders.#" instead of "orders.*" to match all hierarchies.',
        createdAt: "2025-06-17T15:30:00Z",
      },
      {
        id: "r-2",
        content:
          "Let me know if that fixed the issue or if you need any further assistance with your routing setup.",
        createdAt: "2025-06-17T15:35:00Z",
      },
    ],
    "4": [
      {
        id: "r-3",
        content:
          "I've checked your SSL configuration. The issue appears to be with the certificate chain. You need to include the intermediate certificates in your trust store.",
        createdAt: "2025-06-15T17:45:00Z",
      },
    ],
  };

  // Load feedback data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      if (id && mockFeedback[id]) {
        setFeedback(mockFeedback[id]);
        setResponses(mockResponses[id] || []);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  // Format date function is already imported from @/lib/utils

  // Handle back button click
  const handleBack = () => {
    navigate("/feedback");
  };

  // Handle status toggle
  const handleStatusToggle = () => {
    if (feedback) {
      const newStatus = feedback.status === "pending" ? "resolved" : "pending";
      setFeedback({
        ...feedback,
        status: newStatus,
      });

      // Show toast notification
      toast({
        title: "Status updated",
        description: `Feedback marked as ${newStatus}`,
      });

      // In production, this would send an API request to update the status
      console.log(`Status updated to ${newStatus}`);
    }
  };

  // Handle response submission
  const { toast } = useToast();
  const handleSubmitResponse = () => {
    if (!newResponse.trim()) return;

    const newResponseObj: Response = {
      id: `r-${Date.now()}`,
      content: newResponse,
      createdAt: new Date().toISOString(),
    };

    setResponses([...responses, newResponseObj]);
    setNewResponse("");

    // Show toast notification
    toast({
      title: "Response submitted",
      description: "Your response has been added successfully",
    });

    // In production, this would send an API request to save the response
    console.log("Response submitted:", newResponseObj);
  };

  // Format date - replace the existing formatDate function

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-16">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="flex justify-center items-center mt-16">
        <p className="text-lg text-muted-foreground">Feedback not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="mr-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Button>
        <h1 className="text-2xl font-bold">Feedback Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Feedback from {feedback.workspaceName}
                </h2>
                <Badge
                  onClick={handleStatusToggle}
                  className={`cursor-pointer ${
                    feedback.status === "resolved"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {feedback.status === "resolved" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Resolved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Submitted on {formatDate(feedback.createdAt)}
              </p>
              <p className="text-gray-800">{feedback.content}</p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Responses</h2>
              <div className="h-px bg-gray-200 mb-4"></div>

              {responses.length > 0 ? (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <Card key={response.id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium">Admin Response</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(response.createdAt)}
                          </p>
                        </div>
                        <p>{response.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No responses yet</p>
              )}

              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Add Response</h3>
                <Textarea
                  rows={4}
                  placeholder="Type your response here..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!newResponse.trim()}
                >
                  Submit Response
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">User Information</h2>
              <div className="h-px bg-gray-200 mb-4"></div>
              <p className="mb-2">
                <span className="font-medium">Email:</span> {feedback.userEmail}
              </p>
              <p>
                <span className="font-medium">Workspace:</span>{" "}
                {feedback.workspaceName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="h-px bg-gray-200 mb-4"></div>
              <Button
                className="w-full"
                variant={feedback.status === "resolved" ? "outline" : "default"}
                onClick={handleStatusToggle}
              >
                {feedback.status === "resolved"
                  ? "Mark as Pending"
                  : "Mark as Resolved"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;
