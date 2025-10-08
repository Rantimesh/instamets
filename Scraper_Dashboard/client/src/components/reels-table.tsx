import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { filterReelsByDate } from "@/lib/dateFilter";

interface ReelsTableProps {
  timeFilter: string;
  selectedCreator?: string | null;
}

interface Reel {
  username: string;
  url: string;
  likes: number;
  comments: number;
  views: number;
  caption: string;
  hashtags: string;
  mentions: string;
  videoUrl: string;
  datePosted: string;
}

export default function ReelsTable({ timeFilter, selectedCreator }: ReelsTableProps) {
  const [videoType, setVideoType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: apiReels = [], isLoading } = useQuery<Reel[]>({
    queryKey: ['/api/reels'],
  });

  // Filter by date first
  let reels = filterReelsByDate(apiReels, timeFilter);

  // Filter by creator if selected
  if (selectedCreator) {
    reels = reels.filter(r => r.username === selectedCreator);
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getInstagramId = (url: string) => {
    const match = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : 'unknown';
  };

  const calculateEngagement = (likes: number, comments: number, views: number) => {
    if (views === 0) return "0%";
    return `${(((likes + comments) / views) * 100).toFixed(1)}%`;
  };

  const totalPages = Math.ceil(reels.length / itemsPerPage);
  const paginatedReels = reels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return <div className="text-center py-8">Loading reels...</div>;
  }

  return (
    <div className="bg-card rounded-lg border border-border" data-testid="reels-table">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Reels ({reels.length} total)</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reel</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Creator</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Views</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Likes</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comments</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Engagement</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReels.map((reel, idx) => (
              <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center">
                      <span className="text-xl">🎥</span>
                    </div>
                    <div className="max-w-xs">
                      <p className="text-sm font-medium line-clamp-1">{reel.caption || 'No caption'}</p>
                      <p className="text-xs text-muted-foreground">ID: {getInstagramId(reel.url)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">@{reel.username}</td>
                <td className="p-4 text-sm font-medium">{formatNumber(reel.views)}</td>
                <td className="p-4 text-sm">{formatNumber(reel.likes)}</td>
                <td className="p-4 text-sm">{formatNumber(reel.comments)}</td>
                <td className="p-4 text-sm font-medium text-chart-4">
                  {calculateEngagement(reel.likes, reel.comments, reel.views)}
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => window.open(reel.url, '_blank')}
                    className="text-muted-foreground hover:text-foreground transition-colors" 
                    title="View on Instagram"
                  >
                    <i className="fas fa-eye text-sm"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, reels.length)} of {reels.length} reels
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
