import StatCard from '../stat-card';

export default function StatCardExample() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-background">
      <StatCard
        title="Followers"
        value="142,856"
        change="+2.4% from last week"
        changeType="positive"
        icon="fas fa-users"
        color="bg-chart-4/10"
      />
      <StatCard
        title="Total Reels"
        value="847"
        change="+12 this week"
        changeType="positive"
        icon="fas fa-video"
        color="bg-chart-1/10"
      />
      <StatCard
        title="Avg Engagement"
        value="7.8%"
        change="-0.3% from last week"
        changeType="negative"
        icon="fas fa-heart"
        color="bg-chart-2/10"
      />
      <StatCard
        title="Last Run"
        value="2h ago"
        change="Successful"
        changeType="positive"
        icon="fas fa-clock"
        color="bg-chart-3/10"
      />
    </div>
  );
}
