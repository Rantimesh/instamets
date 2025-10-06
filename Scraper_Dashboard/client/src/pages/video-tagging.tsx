import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreatorSelector from "@/components/creator-selector";
import Sidebar from "@/components/sidebar";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { filterReelsByDate } from "@/lib/dateFilter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReelData {
  username: string;
  url: string;
  likes: number;
  comments: number;
  views: number;
  caption: string;
  videoUrl: string;
  datePosted: string;
}

export default function VideoTagging() {
  const [selectedReel, setSelectedReel] = useState<ReelData | null>(null);
  const [videoType, setVideoType] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  let filteredReels = filterReelsByDate(reels, timeFilter);
  
  if (selectedCreator) {
    filteredReels = filteredReels.filter(r => r.username === selectedCreator);
  }

  const handleTagReel = () => {
    console.log(`Tagging reel ${selectedReel?.url} as ${videoType}`);
    setSelectedReel(null);
    setVideoType("");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const untaggedCount = filteredReels.length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Video Tagging</h1>
              <p className="text-muted-foreground">
                {selectedCreator ? "Categorize reels for selected creator" : "Categorize your reels for better analytics"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CreatorSelector 
                selectedCreator={selectedCreator} 
                onCreatorChange={setSelectedCreator}
              />
              <Badge variant="secondary">{untaggedCount} untagged</Badge>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { label: "7d", value: "7d" },
              { label: "14d", value: "14d" },
              { label: "30d", value: "30d" },
              { label: "90d", value: "90d" },
              { label: "180d", value: "180d" },
              { label: "YTD", value: "ytd" },
              { label: "All", value: "all" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredReels.map((reel, index) => (
          <Card key={reel.url || index} className="overflow-hidden">
            <div className="relative aspect-[9/16] bg-muted flex items-center justify-center overflow-hidden">
              {reel.videoUrl ? (
                <video 
                  src={reel.videoUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                />
              ) : (
                <i className="fas fa-video text-6xl text-muted-foreground/20"></i>
              )}
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary">@{reel.username}</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm mb-3 line-clamp-2">{reel.caption || 'No caption'}</p>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">{formatNumber(reel.views)}</div>
                  <div>Views</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{formatNumber(reel.likes)}</div>
                  <div>Likes</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">{formatNumber(reel.comments)}</div>
                  <div>Comments</div>
                </div>
              </div>
              <Button
                variant="default"
                className="w-full"
                size="sm"
                onClick={() => setSelectedReel(reel)}
              >
                Tag Video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedReel} onOpenChange={() => setSelectedReel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag Video Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden max-h-80 flex items-center justify-center">
              {selectedReel?.videoUrl ? (
                <video 
                  src={selectedReel.videoUrl} 
                  className="w-full h-full object-cover"
                  controls
                  muted
                  playsInline
                />
              ) : (
                <i className="fas fa-video text-6xl text-muted-foreground/20"></i>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{selectedReel?.caption || 'No caption'}</p>
            <Select value={videoType} onValueChange={setVideoType}>
              <SelectTrigger>
                <SelectValue placeholder="Select video type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Educational">Educational</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Behind the Scenes">Behind the Scenes</SelectItem>
                <SelectItem value="Product Demo">Product Demo</SelectItem>
                <SelectItem value="Lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedReel(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleTagReel} disabled={!videoType}>
                Save Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </main>
      </div>
    </div>
  );
}
