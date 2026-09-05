import { useQuery } from "@tanstack/react-query";
import { listDonors } from "../api/admin";
import { BLOOD_GROUP_LABELS } from "../types";

export default function DonorsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-donors"], queryFn: listDonors });

  return (
    <>
      <h2>Donors</h2>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Blood group</th>
                <th>Last donation</th>
                <th>Eligibility</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {data?.donors.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.name} <span style={{ color: "#999" }}>@{d.username}</span>
                  </td>
                  <td>{BLOOD_GROUP_LABELS[d.bloodGroup]}</td>
                  <td>{d.lastDonationDate ? new Date(d.lastDonationDate).toDateString() : "—"}</td>
                  <td>
                    <span className="badge">
                      <span className="dot" style={{ background: d.isActive ? "#2E7D32" : "#9E9E9E" }} />
                      {d.isActive ? "Active" : "Not yet eligible"}
                    </span>
                  </td>
                  <td>{d.addressText ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
