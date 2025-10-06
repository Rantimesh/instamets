import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

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

  const allCreators = selectedCreator 
    ? [selectedCreator]
    : Array.from(new Set(followerData.map(d => d.username)));

  const [hiddenCreators, setHiddenCreators] = useState<Set<string>>(new Set());

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

  const creatorsToShow = allCreators.filter(creator => !hiddenCreators.has(creator));

  const getChartColor = (index: number): string => {
    const colorVars = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(var(--chart-6))',
      'hsl(var(--chart-7))',
      'hsl(var(--chart-8))',
      'hsl(var(--chart-9))',
      'hsl(var(--chart-10))',
      'hsl(var(--chart-11))',
      'hsl(var(--chart-12))',
    ];
    return colorVars[index % colorVars.length];
  };

  const toggleCreator = (creator: string) => {
    const newHidden = new Set(hiddenCreators);
    if (newHidden.has(creator)) {
      newHidden.delete(creator);
    } else {
      newHidden.add(creator);
    }
    setHiddenCreators(newHidden);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="followers-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Follower Growth Over Time</h3>
        <div className="flex items-center gap-3 flex-wrap max-w-2xl">
          {allCreators.map((creator, index) => {
            const isHidden = hiddenCreators.has(creator);
            return (
              <button
                key={creator}
                onClick={() => toggleCreator(creator)}
                className="flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity"
              >
                <div 
                  className="w-3 h-3 rounded-full transition-opacity" 
                  style={{ 
                    backgroundColor: getChartColor(index),
                    opacity: isHidden ? 0.3 : 1 
                  }}
                ></div>
                <span 
                  className={`text-xs ${isHidden ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground'}`}
                >
                  @{creator}
                </span>
              </button>
            );
          })}
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
          {creatorsToShow.map((creator, index) => {
            const creatorIndex = allCreators.indexOf(creator);
            return (
              <Line 
                key={creator}
                type="monotone" 
                dataKey={creator} 
                stroke={getChartColor(creatorIndex)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            );
          })}
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
