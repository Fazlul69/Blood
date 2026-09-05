import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../api/admin";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: getSettings });
  const [cycleDays, setCycleDays] = useState("120");
  const [antibioticGapDays, setAntibioticGapDays] = useState("10");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    const map = Object.fromEntries(data.settings.map((s) => [s.key, s.value]));
    if (map.donation_cycle_days) setCycleDays(map.donation_cycle_days);
    if (map.antibiotic_gap_days) setAntibioticGapDays(map.antibiotic_gap_days);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateSettings({ donation_cycle_days: Number(cycleDays), antibiotic_gap_days: Number(antibioticGapDays) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <p>Loading…</p>;

  return (
    <>
      <h2>Eligibility settings</h2>
      <div className="card" style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Donation cycle (days before a donor is eligible again)
          </label>
          <input className="input" type="number" min={1} value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Antibiotic gap (days after last antibiotic use before eligible)
          </label>
          <input
            className="input"
            type="number"
            min={1}
            value={antibioticGapDays}
            onChange={(e) => setAntibioticGapDays(e.target.value)}
          />
        </div>
        <button className="btn" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Save
        </button>
        {saved && <span style={{ color: "#2E7D32", fontSize: 13 }}>Saved</span>}
      </div>
    </>
  );
}
