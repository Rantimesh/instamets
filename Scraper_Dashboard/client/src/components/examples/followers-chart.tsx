import FollowersChart from '../followers-chart';

export default function FollowersChartExample() {
  return (
    <div className="p-6 bg-background">
      <FollowersChart timeFilter="7d" />
    </div>
  );
}
