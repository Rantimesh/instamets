import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FollowersChartProps {
  timeFilter: string;
  selectedCreator: string | null;
}

interface FollowerData {
  username: string;
  followers: number;
  reelsScraped: number;
  timestamp: string;
}

export default function FollowersChart({ timeFilter, selectedCreator }: FollowersChartProps) {
  const { data: followerData = [] } = useQuery<FollowerData[]>({
    queryKey: ['/api/followers'],
  });

  const filteredData = selectedCreator 
    ? followerData.filter(c => c.username === selectedCreator)
    : followerData;

  // Transform data for time-series chart
  // Group by timestamp and create data points for each creator
  const timestamps = Array.from(new Set(followerData.map(d => d.timestamp))).sort();
  
  const chartData = timestamps.map(timestamp => {
    const dataPoint: any = { timestamp };
    followerData
      .filter(d => d.timestamp === timestamp)
      .forEach(d => {
        if (!selectedCreator || d.username === selectedCreator) {
          dataPoint[d.username] = d.followers;
        }
      });
    return dataPoint;
  });

  const creatorsToShow = selectedCreator 
    ? [selectedCreator]
    : Array.from(new Set(followerData.map(d => d.username)));

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a28bfe'];

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="followers-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Follower Growth Over Time</h3>
        <div className="flex items-center gap-3">
          {creatorsToShow.map((creator, index) => (
            <div key={creator} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-xs text-muted-foreground">@{creator}</span>
            </div>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="timestamp" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          {creatorsToShow.map((creator, index) => (
            <Line 
              key={creator}
              type="monotone" 
              dataKey={creator} 
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {chartData.length === 1 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">
            📊 Showing current follower count from latest scrape ({chartData[0]?.timestamp})
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Trend lines will appear as more scrapes are added to the history
          </p>
        </div>
      )}
    </div>
  );
}
