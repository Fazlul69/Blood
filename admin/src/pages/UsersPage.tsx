import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, updateUser } from "../api/admin";
import { BLOOD_GROUP_LABELS } from "../types";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users", query], queryFn: () => listUsers(query || undefined) });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "banned" }) => updateUser(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <>
      <h2>Users</h2>
      <input
        className="input"
        style={{ maxWidth: 320, marginBottom: 16 }}
        placeholder="Search by username, phone, or name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Blood group</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>@{u.username}</td>
                  <td>{u.phone}</td>
                  <td>{BLOOD_GROUP_LABELS[u.bloodGroup]}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className="badge">
                      <span className="dot" style={{ background: u.status === "active" ? "#2E7D32" : "#B00020" }} />
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn secondary small"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ id: u.id, status: u.status === "active" ? "banned" : "active" })}
                    >
                      {u.status === "active" ? "Ban" : "Unban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
