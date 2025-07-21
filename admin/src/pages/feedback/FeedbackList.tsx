import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

// Define types
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

const FeedbackList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock feedback data (would come from API in production)
  const mockFeedback: Feedback[] = [
    {
      id: "1",
      workspaceId: "ws-1",
      workspaceName: "TechCorp",
      userId: "user-1",
      userEmail: "john@techcorp.com",
      content: "Having issues connecting to RabbitMQ cluster",
      status: "pending",
      createdAt: "2025-06-18T10:30:00Z",
    },
    {
      id: "2",
      workspaceId: "ws-2",
      workspaceName: "DevTeam",
      userId: "user-2",
      userEmail: "sarah@devteam.com",
      content: "Need help with message routing configuration",
      status: "resolved",
      createdAt: "2025-06-17T14:15:00Z",
    },
    {
      id: "3",
      workspaceId: "ws-1",
      workspaceName: "TechCorp",
      userId: "user-3",
      userEmail: "mike@techcorp.com",
      content: "Would like to request additional queue features",
      status: "pending",
      createdAt: "2025-06-16T09:45:00Z",
    },
    {
      id: "4",
      workspaceId: "ws-3",
      workspaceName: "CloudSys",
      userId: "user-4",
      userEmail: "alex@cloudsys.com",
      content: "SSL certificate issue with RabbitMQ connection",
      status: "resolved",
      createdAt: "2025-06-15T16:20:00Z",
    },
    {
      id: "5",
      workspaceId: "ws-4",
      workspaceName: "FinTech",
      userId: "user-5",
      userEmail: "lisa@fintech.com",
      content: "Need help with message persistence settings",
      status: "pending",
      createdAt: "2025-06-14T11:10:00Z",
    },
  ];

  // Filter feedback based on search query
  const filteredFeedback = searchQuery
    ? mockFeedback.filter(
        (item) =>
          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.workspaceName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockFeedback;

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle view feedback details
  const handleViewFeedback = (id: string) => {
    navigate(`/feedback/${id}`);
  };

  // Format date is imported from utils

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feedback</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 w-full"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Workspace
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Content
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(rowsPerPage > 0
                ? filteredFeedback.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                : filteredFeedback
              ).map((feedback) => (
                <tr key={feedback.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {feedback.workspaceName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {feedback.userEmail}
                  </td>
                  <td className="px-6 py-4">
                    {feedback.content.length > 50
                      ? `${feedback.content.substring(0, 50)}...`
                      : feedback.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={`${
                        feedback.status === "resolved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {feedback.status === "resolved" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        {feedback.status === "resolved"
                          ? "Resolved"
                          : "Pending"}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(feedback.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewFeedback(feedback.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredFeedback.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No feedback found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              className="border border-gray-200 rounded text-sm py-1"
              value={rowsPerPage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            >
              {[5, 10, 25].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {page * rowsPerPage + 1}-
              {Math.min((page + 1) * rowsPerPage, filteredFeedback.length)} of{" "}
              {filteredFeedback.length}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangePage({} as unknown, page - 1)}
                disabled={page === 0}
                className="h-8 w-8 p-0"
              >
                &lt;
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangePage({} as unknown, page + 1)}
                disabled={(page + 1) * rowsPerPage >= filteredFeedback.length}
                className="h-8 w-8 p-0"
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackList;
