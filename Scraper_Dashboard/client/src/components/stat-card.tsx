interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: string;
  color: string;
}

export default function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
          <p className={`text-xs mt-1 ${changeType === 'positive' ? 'text-chart-4' : 'text-destructive'}`}>
            <i className={`fas fa-arrow-${changeType === 'positive' ? 'up' : 'down'} mr-1`}></i>
            {change}
          </p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <i className={`${icon} ${color.replace('bg-', 'text-').replace('/10', '')}`}></i>
        </div>
      </div>
    </div>
  );
}
