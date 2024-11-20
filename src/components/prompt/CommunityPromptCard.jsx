import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { useForkPrompt } from '@/hooks/useCommunity';

const CommunityPromptCard = ({ prompt, onShare, onFork, onClick }) => {
  const { mutate: forkPrompt, isLoading: isForking } = useForkPrompt();

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/app/prompts/${prompt.id}`;
    navigator.clipboard.writeText(url);
    onShare?.(prompt.id);
  };

  const handleFork = async (e) => {
    e.stopPropagation();
    try {
      await forkPrompt(prompt.id);
      onFork?.(prompt);
    } catch (error) {
      console.error('Error forking prompt:', error);
    }
  };

  // Ensure we have valid data
  if (!prompt?.id || !prompt?.title) {
    console.warn('Invalid prompt data:', prompt);
    return null;
  }

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={prompt.author?.avatar_url} />
              <AvatarFallback>{prompt.author?.full_name?.[0] || 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{prompt.author?.full_name || 'Anonymous'}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <CardTitle className="mb-2 line-clamp-2">{prompt.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {prompt.description || 'No description provided'}
        </CardDescription>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFork}
          disabled={isForking}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CommunityPromptCard;