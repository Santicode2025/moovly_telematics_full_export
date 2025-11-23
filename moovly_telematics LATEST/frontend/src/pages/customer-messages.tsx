import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  User, 
  Users, 
  Clock,
  Phone,
  Package
} from "lucide-react";
import { useLocation } from "wouter";

interface Message {
  id: number;
  orderId?: number;
  senderType: "customer" | "dispatcher" | "system";
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  orderId: number;
  orderNumber: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  dispatcherName?: string;
}

export default function CustomerMessagesPage() {
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/customer/conversations"],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/customer/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { orderId: number; message: string }) => {
      const response = await fetch("/api/customer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderId,
          senderType: "customer",
          senderName: "Customer",
          message: data.message,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/conversations"] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      orderId: selectedConversation,
      message: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedOrder = conversations.find(c => c.orderId === selectedConversation);

  // Mock data for demonstration until backend is implemented
  const mockConversations: Conversation[] = [
    {
      orderId: 1,
      orderNumber: "ORD-2024-001",
      lastMessage: "Your package has been picked up and is on the way",
      lastMessageTime: "2 min ago",
      unreadCount: 2,
      dispatcherName: "Sarah Johnson"
    },
    {
      orderId: 2,
      orderNumber: "ORD-2024-002", 
      lastMessage: "Driver is 10 minutes away from pickup location",
      lastMessageTime: "15 min ago",
      unreadCount: 0,
      dispatcherName: "Mike Chen"
    },
    {
      orderId: 3,
      orderNumber: "ORD-2024-003",
      lastMessage: "Package delivered successfully",
      lastMessageTime: "1 hour ago",
      unreadCount: 0,
      dispatcherName: "Emma Davis"
    }
  ];

  const mockMessages: Message[] = selectedConversation === 1 ? [
    {
      id: 1,
      orderId: 1,
      senderType: "system",
      senderName: "System",
      message: "Order ORD-2024-001 has been confirmed and assigned to driver Fernando Santos",
      isRead: true,
      createdAt: "2024-08-23T10:00:00Z"
    },
    {
      id: 2,
      orderId: 1,
      senderType: "customer",
      senderName: "You",
      message: "Hi, when will the driver arrive for pickup?",
      isRead: true,
      createdAt: "2024-08-23T10:15:00Z"
    },
    {
      id: 3,
      orderId: 1,
      senderType: "dispatcher",
      senderName: "Sarah Johnson",
      message: "Hello! The driver is currently 15 minutes away from your pickup location. He'll call when he arrives.",
      isRead: true,
      createdAt: "2024-08-23T10:20:00Z"
    },
    {
      id: 4,
      orderId: 1,
      senderType: "dispatcher",
      senderName: "Sarah Johnson",
      message: "Your package has been picked up and is on the way to the delivery address. ETA is 45 minutes.",
      isRead: false,
      createdAt: "2024-08-23T11:45:00Z"
    },
    {
      id: 5,
      orderId: 1,
      senderType: "system",
      senderName: "System",
      message: "Package is out for delivery. Track live location in your dashboard.",
      isRead: false,
      createdAt: "2024-08-23T11:46:00Z"
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/customer/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">Messages</h1>
                <p className="text-sm text-gray-600">Chat with dispatchers about your orders</p>
              </div>
            </div>
          </div>
          <Button variant="outline">
            <Phone className="w-4 h-4 mr-2" />
            Call Support
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockConversations.map((conversation) => (
                  <div
                    key={conversation.orderId}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.orderId ? "bg-blue-50 border-r-2 border-r-blue-500" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation.orderId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{conversation.orderNumber}</span>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>with {conversation.dispatcherName}</span>
                      <span>{conversation.lastMessageTime}</span>
                    </div>
                  </div>
                ))}
              </div>

              {mockConversations.length === 0 && (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400">Messages will appear here when you place orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages Panel */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          <Users className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedOrder?.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          Dispatcher: {selectedOrder?.dispatcherName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Active</Badge>
                      <Button variant="outline" size="sm">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {mockMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === "customer" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${message.senderType === "customer" ? "order-2" : "order-1"}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            {message.senderType !== "customer" && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {message.senderType === "system" ? "S" : 
                                   message.senderType === "dispatcher" ? "D" : "C"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-xs text-gray-500">{message.senderName}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.senderType === "customer"
                                ? "bg-blue-500 text-white"
                                : message.senderType === "system"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-white border text-gray-800"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose an order from the left to start chatting with the dispatcher
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}