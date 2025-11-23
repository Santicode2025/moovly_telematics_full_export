import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Users, 
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Truck,
  Calendar,
  Phone,
  Camera,
  Image,
  Download,
  Paperclip,
  X
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderType: 'dispatcher' | 'driver';
  recipientId: number;
  recipientName: string;
  recipientType: 'dispatcher' | 'driver';
  content: string;
  messageType: 'text' | 'alert' | 'job_update' | 'system' | 'image';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: Date;
  jobId?: number;
  jobNumber?: string;
  imageUrl?: string;
  imageName?: string;
}

interface Driver {
  id: number;
  name: string;
  username: string;
  status: string;
  phone: string;
  vehicleId?: number;
}

interface Conversation {
  participantId: number;
  participantName: string;
  participantType: 'dispatcher' | 'driver';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: string;
  phone?: string;
  vehicleId?: number;
}

export default function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageFilter, setMessageFilter] = useState<string>("all");
  const [newRecipient, setNewRecipient] = useState<string>("");
  const [driverSearchTerm, setDriverSearchTerm] = useState("");
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driverSearchRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all drivers for the searchable dropdown
  const { data: allDrivers = [] } = useQuery({
    queryKey: ['/api/drivers'],
  });

  // Filter drivers based on search term
  const filteredDrivers = (allDrivers as any[]).filter((driver: any) => {
    if (!driverSearchTerm) return true;
    const searchLower = driverSearchTerm.toLowerCase();
    const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.toLowerCase();
    const email = (driver.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  }).slice(0, 10); // Limit to 10 results for performance

  // Handle driver selection
  const handleDriverSelect = (driver: any) => {
    setNewRecipient(driver.id.toString());
    setDriverSearchTerm(`${driver.firstName || ''} ${driver.lastName || ''}`.trim());
    setShowDriverDropdown(false);
    
    // Start new conversation with selected driver
    setSelectedConversation(driver.id);
    
    toast({
      title: "New conversation started",
      description: `You can now message ${driver.firstName} ${driver.lastName}`,
    });
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (driverSearchRef.current && !driverSearchRef.current.contains(event.target as Node)) {
        setShowDriverDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch real messages from API
  const { data: allMessages = [] } = useQuery({
    queryKey: ['/api/messages'],
  });

  // Convert drivers data to include messaging status
  const driversWithMessages = ((allDrivers as any[]) || []).map((driver: any) => {
    const driverMessages = ((allMessages as any[]) || []).filter((msg: any) => 
      msg.fromUserId === driver.id || msg.toUserId === driver.id
    );
    const lastMessage = driverMessages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const unreadCount = driverMessages.filter((msg: any) => 
      !msg.isRead && msg.fromUserId === driver.id
    ).length;

    return {
      participantId: driver.id,
      participantName: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name,
      participantType: "driver" as const,
      lastMessage: lastMessage?.message || "No messages yet",
      lastMessageTime: lastMessage ? new Date(lastMessage.createdAt) : new Date(),
      unreadCount,
      status: driver.status || "offline",
      phone: driver.phone,
      vehicleId: driver.vehicleId
    };
  });

  const conversations: Conversation[] = driversWithMessages;

  // Get messages for selected conversation
  const messages = selectedConversation 
    ? (allMessages as any[])
        .filter((msg: any) => 
          (msg.fromUserId === selectedConversation && msg.toUserId === 1) ||
          (msg.fromUserId === 1 && msg.toUserId === selectedConversation)
        )
        .map((msg: any) => {
          const isFromDriver = msg.fromUserId === selectedConversation;
          const driver = ((allDrivers as any[]) || []).find((d: any) => d.id === selectedConversation);
          const driverName = driver ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name : `Driver ${selectedConversation}`;
          
          return {
            id: msg.id,
            senderId: msg.fromUserId,
            senderName: isFromDriver ? driverName : "Dispatcher",
            senderType: isFromDriver ? "driver" as const : "dispatcher" as const,
            recipientId: msg.toUserId,
            recipientName: !isFromDriver ? driverName : "Dispatcher",
            recipientType: !isFromDriver ? "driver" as const : "dispatcher" as const,
            content: msg.message,
            messageType: msg.messageType || "text",
            priority: "medium" as const,
            isRead: msg.isRead,
            createdAt: new Date(msg.createdAt),
            jobId: msg.jobId,
            jobNumber: msg.jobNumber,
            imageUrl: msg.imageUrl,
            imageName: msg.imageName
          };
        })
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    : [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview("");
      toast({
        title: "Message sent",
        description: "Your message has been delivered successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle sending message
  const handleSendMessage = () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return;

    const messageData = {
      fromUserId: 1, // Dispatcher ID
      toUserId: selectedConversation,
      message: newMessage.trim() || 'Image shared',
      messageType: selectedImage ? 'image' : 'text',
      entityType: null,
      entityId: null
    };

    sendMessageMutation.mutate(messageData);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartNewConversation = (driverId: string) => {
    const driver = (allDrivers as any[]).find((d: any) => d.id.toString() === driverId);
    if (driver) {
      setSelectedConversation(driver.id);
      setNewRecipient("");
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = messageFilter === "all" || 
      (messageFilter === "unread" && conv.unreadCount > 0) ||
      (messageFilter === "drivers" && conv.participantType === "driver");
    return matchesSearch && matchesFilter;
  });

  const selectedConversationData = conversations.find(conv => conv.participantId === selectedConversation);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(date);
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return messageDate.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const downloadImage = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: `Downloading ${imageName}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the image.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Team Messaging" />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Messaging</h1>
                <p className="text-muted-foreground">
                  Communicate with drivers and dispatchers in real-time
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {conversations.filter(c => c.unreadCount > 0).length} Unread
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Conversations</CardTitle>
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    
                    <Select value={messageFilter} onValueChange={setMessageFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Conversations</SelectItem>
                        <SelectItem value="unread">Unread Only</SelectItem>
                        <SelectItem value="drivers">Drivers Only</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Start New Conversation - Searchable */}
                    <div className="relative" ref={driverSearchRef}>
                      <Input
                        placeholder="Search drivers by name or email..."
                        value={driverSearchTerm}
                        onChange={(e) => {
                          setDriverSearchTerm(e.target.value);
                          setShowDriverDropdown(true);
                        }}
                        onFocus={() => setShowDriverDropdown(true)}
                        className="pr-16"
                      />
                      {driverSearchTerm && (
                        <button
                          onClick={() => {
                            setDriverSearchTerm("");
                            setShowDriverDropdown(false);
                            setNewRecipient("");
                          }}
                          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      
                      {/* Searchable Dropdown */}
                      {showDriverDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredDrivers.length > 0 ? (
                            filteredDrivers.map((driver: any) => (
                              <div
                                key={driver.id}
                                className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => handleDriverSelect(driver)}
                              >
                                <User className="h-4 w-4 text-gray-400" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {driver.firstName} {driver.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {driver.email}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {driver.status || 'Available'}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-sm text-gray-500">
                              {driverSearchTerm ? 'No drivers found' : 'Type to search drivers...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <ScrollArea className="h-[450px]">
                    <div className="space-y-1 p-4">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.participantId}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation === conversation.participantId
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedConversation(conversation.participantId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">
                                  {conversation.participantName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {conversation.lastMessage}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(conversation.lastMessageTime)}
                                  </span>
                                  {conversation.phone && (
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-xs px-1 py-0">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  conversation.status === 'online' 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}
                              >
                                {conversation.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Messages Panel */}
              <Card className="lg:col-span-2">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{selectedConversationData?.participantName}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedConversationData?.participantType} • {selectedConversationData?.status}
                            </p>
                          </div>
                        </div>
                        {selectedConversationData?.phone && (
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardContent className="flex flex-col h-[450px]">
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderType === 'dispatcher' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  message.senderType === 'dispatcher'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">
                                    {message.senderName}
                                  </span>
                                  {message.priority && message.priority !== 'low' && (
                                    <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                                      {message.priority}
                                    </Badge>
                                  )}
                                </div>

                                {/* Image Message */}
                                {message.messageType === 'image' && message.imageUrl && (
                                  <div className="mb-2">
                                    <div className="relative">
                                      <img 
                                        src={message.imageUrl} 
                                        alt={message.imageName || 'Shared image'}
                                        className="max-w-full h-auto rounded border"
                                        style={{ maxHeight: '200px' }}
                                      />
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="absolute top-2 right-2 h-8 w-8 p-0"
                                        onClick={() => downloadImage(message.imageUrl!, message.imageName || 'image.jpg')}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <p className="text-xs mt-1 opacity-75">
                                      📷 {message.imageName || 'Image'}
                                    </p>
                                  </div>
                                )}

                                {/* Text Content */}
                                <p className="text-sm">{message.content}</p>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs ${
                                    message.senderType === 'dispatcher' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatTime(message.createdAt)}
                                  </span>
                                  {message.senderType === 'dispatcher' && (
                                    <CheckCircle2 className={`h-3 w-3 ${
                                      message.isRead ? 'text-blue-200' : 'text-blue-300'
                                    }`} />
                                  )}
                                </div>
                                {message.jobNumber && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    Job: {message.jobNumber}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="border-t pt-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Image className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-600">Image selected</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={removeSelectedImage}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="relative inline-block">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="max-h-20 max-w-20 object-cover rounded border"
                            />
                          </div>
                        </div>
                      )}

                      {/* Message Input */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <Textarea
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="min-h-[40px] max-h-[120px] resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-col space-y-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageSelect}
                              accept="image/*"
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3"
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleSendMessage}
                              disabled={(!newMessage.trim() && !selectedImage) || sendMessageMutation.isPending}
                              className="px-3"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                      <p className="text-muted-foreground">
                        Choose a conversation from the list or start a new one with a driver
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}