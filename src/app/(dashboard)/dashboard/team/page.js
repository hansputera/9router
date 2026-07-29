"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, Button, Input } from "@/shared/components";

export default function TeamPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [createName, setCreateName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.teams) setTeams(data.teams);
    } catch {}
    setLoading(false);
  };

  const loadMembers = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (res.ok) setMembers(await res.json());
    } catch {}
  };

  useEffect(() => { loadTeams(); }, []);
  useEffect(() => { if (selectedTeam) loadMembers(selectedTeam.id); }, [selectedTeam]);

  const createTeam = async () => {
    if (!createName.trim()) return;
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (res.ok) {
        setCreateName("");
        loadTeams();
      }
    } catch {}
  };

  const removeMember = async (userId) => {
    if (!selectedTeam) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      loadMembers(selectedTeam.id);
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0 flex justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isAdmin = selectedTeam?.role === "admin";
  const currentOrgId = session?.user?.orgId;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-text-muted text-sm mt-1">Manage your organizations and members</p>
        </div>
      </div>

      {/* Create team */}
      <Card>
        <h3 className="font-semibold mb-3">Create Team</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Team name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTeam()}
          />
          <Button variant="primary" onClick={createTeam} disabled={!createName.trim()}>
            Create
          </Button>
        </div>
      </Card>

      {/* Team list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {teams.length === 0 && (
          <Card className="col-span-full">
            <p className="text-text-muted text-sm text-center py-4">No teams yet. Create one above.</p>
          </Card>
        )}
        {teams.map((team) => (
          <Card
            key={team.id}
            padding="sm"
            className={`cursor-pointer transition-colors ${selectedTeam?.id === team.id ? "ring-2 ring-primary" : "hover:bg-surface-2"}`}
            onClick={() => setSelectedTeam(team)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{team.name}</p>
                <p className="text-xs text-text-muted">{team.role === "admin" ? "Admin" : "Member"}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${team.id === currentOrgId ? "bg-green-500/10 text-green-500" : "bg-surface text-text-muted"}`}>
                {team.id === currentOrgId ? "Active" : ""}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Team members */}
      {selectedTeam && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selectedTeam.name} — Members</h3>
            {selectedTeam.id !== currentOrgId && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await fetch("/api/auth/me", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ activeOrgId: selectedTeam.id }),
                  });
                  window.location.reload();
                }}
              >
                Switch to this team
              </Button>
            )}
          </div>

          {members.length === 0 ? (
            <p className="text-text-muted text-sm">Loading members...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-bg border border-border">
                  <div className="flex items-center gap-3">
                    {m.image ? (
                      <img src={m.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        {(m.name || m.email || "U")[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{m.name || m.email || "Unknown"}</p>
                      <p className="text-xs text-text-muted">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-surface text-text-muted"}`}>
                      {m.role === "admin" ? "Admin" : "Member"}
                    </span>
                    {isAdmin && m.userId !== session?.user?.id && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        className="text-xs text-red-500 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-2">
                Share this team ID with users who already have an account:
              </p>
              <code className="text-xs bg-bg px-2 py-1 rounded border border-border font-mono break-all">
                {selectedTeam.id}
              </code>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
