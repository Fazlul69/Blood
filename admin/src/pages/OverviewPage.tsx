import { useQuery } from "@tanstack/react-query";
import { getStats } from "../api/admin";

export default function OverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <>
      <h2>Overview</h2>
      {isLoading || !data ? (
        <p>Loading…</p>
      ) : (
        <div className="stat-grid">
          <div className="card">
            <div className="stat-value">{data.totalUsers}</div>
            <div className="stat-label">Total users</div>
          </div>
          <div className="card">
            <div className="stat-value">{data.totalDonations}</div>
            <div className="stat-label">Total donations logged</div>
          </div>
          <div className="card">
            <div className="stat-value">{data.bannedUsers}</div>
            <div className="stat-label">Banned users</div>
          </div>
        </div>
      )}
    </>
  );
}
