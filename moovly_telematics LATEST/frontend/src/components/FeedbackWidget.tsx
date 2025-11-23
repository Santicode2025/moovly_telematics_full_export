import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Smile,
  Frown,
  Meh,
  Send,
  CheckCircle,
  X
} from "lucide-react";

interface EmojiReaction {
  emoji: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface FeedbackSubmission {
  type: 'emoji' | 'detailed';
  reaction: string;
  category: string;
  message?: string;
  timestamp: string;
}

interface FeedbackWidgetProps {
  context?: string; // Context of where feedback is being given (dashboard, jobs, etc.)
  className?: string;
}

export default function FeedbackWidget({ context = "general", className = "" }: FeedbackWidgetProps) {
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const emojiReactions: EmojiReaction[] = [
    {
      emoji: "😍",
      label: "Love it",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-100 hover:bg-red-200"
    },
    {
      emoji: "👍",
      label: "Great",
      icon: ThumbsUp,
      color: "text-green-600",
      bgColor: "bg-green-100 hover:bg-green-200"
    },
    {
      emoji: "⭐",
      label: "Excellent",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 hover:bg-yellow-200"
    },
    {
      emoji: "😊",
      label: "Good",
      icon: Smile,
      color: "text-blue-600",
      bgColor: "bg-blue-100 hover:bg-blue-200"
    },
    {
      emoji: "😐",
      label: "Okay",
      icon: Meh,
      color: "text-gray-600",
      bgColor: "bg-gray-100 hover:bg-gray-200"
    },
    {
      emoji: "👎",
      label: "Not great",
      icon: ThumbsDown,
      color: "text-orange-600",
      bgColor: "bg-orange-100 hover:bg-orange-200"
    },
    {
      emoji: "😞",
      label: "Disappointing",
      icon: Frown,
      color: "text-purple-600",
      bgColor: "bg-purple-100 hover:bg-purple-200"
    }
  ];

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedback: FeedbackSubmission) => {
      setIsSubmitting(true);
      const response = await apiRequest("/api/feedback", {
        method: "POST",
        body: JSON.stringify(feedback),
      });
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Feedback Submitted!",
        description: `Thank you for your ${variables.reaction} feedback. We appreciate your input!`,
        duration: 3000,
      });
      setLastSubmitted(variables.reaction);
      setSelectedReaction(null);
      setFeedbackMessage("");
      setShowDetailedFeedback(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      
      // Reset the success state after 3 seconds
      setTimeout(() => {
        setLastSubmitted(null);
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleEmojiClick = (reaction: EmojiReaction) => {
    const feedback: FeedbackSubmission = {
      type: 'emoji',
      reaction: reaction.label,
      category: context,
      timestamp: new Date().toISOString()
    };
    
    submitFeedbackMutation.mutate(feedback);
  };

  const handleDetailedSubmit = () => {
    if (!selectedReaction || !feedbackMessage.trim()) return;
    
    const selectedEmoji = emojiReactions.find(r => r.label === selectedReaction);
    const feedback: FeedbackSubmission = {
      type: 'detailed',
      reaction: selectedReaction,
      category: context,
      message: feedbackMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    submitFeedbackMutation.mutate(feedback);
  };

  if (lastSubmitted) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Feedback submitted!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          How was your experience?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Emoji Reactions */}
        <div className="grid grid-cols-4 gap-2">
          {emojiReactions.slice(0, 4).map((reaction) => (
            <Button
              key={reaction.label}
              variant="ghost"
              size="sm"
              className={`h-12 flex flex-col items-center p-2 transition-all ${reaction.bgColor} ${reaction.color} hover:scale-105`}
              onClick={() => handleEmojiClick(reaction)}
              disabled={isSubmitting}
            >
              <span className="text-lg mb-1">{reaction.emoji}</span>
              <span className="text-xs">{reaction.label}</span>
            </Button>
          ))}
        </div>

        {/* More Options Row */}
        <div className="grid grid-cols-3 gap-2">
          {emojiReactions.slice(4).map((reaction) => (
            <Button
              key={reaction.label}
              variant="ghost"
              size="sm"
              className={`h-10 flex items-center justify-center p-2 transition-all ${reaction.bgColor} ${reaction.color} hover:scale-105`}
              onClick={() => handleEmojiClick(reaction)}
              disabled={isSubmitting}
            >
              <span className="text-sm mr-1">{reaction.emoji}</span>
              <span className="text-xs">{reaction.label}</span>
            </Button>
          ))}
        </div>

        {/* Detailed Feedback Option */}
        <div className="pt-2 border-t">
          <Dialog open={showDetailedFeedback} onOpenChange={setShowDetailedFeedback}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="w-3 h-3 mr-2" />
                Leave detailed feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Detailed Feedback</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    How would you rate your experience?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {emojiReactions.slice(0, 4).map((reaction) => (
                      <Button
                        key={reaction.label}
                        variant={selectedReaction === reaction.label ? "default" : "outline"}
                        size="sm"
                        className="h-10 flex flex-col items-center p-1"
                        onClick={() => setSelectedReaction(reaction.label)}
                      >
                        <span className="text-sm">{reaction.emoji}</span>
                        <span className="text-xs">{reaction.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tell us more (optional)
                  </label>
                  <Textarea
                    placeholder="What did you like or what could be improved?"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailedFeedback(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDetailedSubmit}
                    disabled={!selectedReaction || isSubmitting}
                  >
                    <Send className="w-3 h-3 mr-2" />
                    Submit Feedback
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Context Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            Feedback for: {context}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}