import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface PerformanceChartProps {
  timeFilter: string;
  selectedCreator?: string | null;
}

interface ReelData {
  username: string;
  hashtags: string;
  views: number;
  likes: number;
  comments: number;
}

export default function PerformanceChart({ timeFilter, selectedCreator }: PerformanceChartProps) {
  const [metric, setMetric] = useState("engagement");

  const { data: allReels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  const reels = selectedCreator 
    ? allReels.filter(r => r.username === selectedCreator)
    : allReels;

  const hashtagMetrics = reels
    .flatMap(r => (r.hashtags || '').split(',').map(h => ({
      tag: h.trim(),
      views: r.views || 0,
      likes: r.likes || 0,
      comments: r.comments || 0,
    })))
    .filter(item => item.tag.length > 0)
    .reduce((acc, item) => {
      if (!acc[item.tag]) {
        acc[item.tag] = { count: 0, views: 0, likes: 0, comments: 0 };
      }
      acc[item.tag].count += 1;
      acc[item.tag].views += item.views;
      acc[item.tag].likes += item.likes;
      acc[item.tag].comments += item.comments;
      return acc;
    }, {} as Record<string, { count: number; views: number; likes: number; comments: number }>);

  const getMetricValue = (stats: { count: number; views: number; likes: number; comments: number }) => {
    if (metric === "views") return stats.views;
    if (metric === "likes") return stats.likes;
    return stats.views > 0 ? ((stats.likes + stats.comments) / stats.views * 100) : 0;
  };

  const videoTypes = Object.entries(hashtagMetrics)
    .map(([name, stats]) => ({
      name: `#${name}`,
      value: getMetricValue(stats),
      count: stats.count,
      color: `bg-chart-${(Object.keys(hashtagMetrics).indexOf(name) % 5) + 1}` as const,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const maxCount = Math.max(...videoTypes.map(t => t.value), 1);

  const formatValue = (value: number) => {
    if (metric === "engagement") return `${value.toFixed(1)}%`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="performance-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Top Hashtags</h3>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-40" data-testid="metric-selector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engagement">Engagement Rate</SelectItem>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        {videoTypes.length > 0 ? videoTypes.map((type) => (
          <div key={type.name} data-testid={`performance-item-${type.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{type.name}</span>
              <span className="text-sm text-muted-foreground">{formatValue(type.value)} ({type.count} reels)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`${type.color} h-2 rounded-full`} 
                style={{ width: `${(type.value / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hashtag data available
          </p>
        )}
      </div>
    </div>
  );
}
