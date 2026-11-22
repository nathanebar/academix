import api from "../api/axios";
import { useState, useEffect } from "react";
import { User } from "../types/types";

interface TeamMember {
  delete_reason: string;
  id: number;
  User?: User;
  user_id?:number | null
}

export const useTeamMembers = (
  teamId: number | null,
  courseBatchId: number
) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<TeamMember[]>(
        `/teamMembers/getUsersTeam/${teamId}/${courseBatchId}`
      );
      setTeamMembers(response.data);
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamMembers();
    } else {
      setTeamMembers([]);
    }
  }, [courseBatchId]);

  return {
    teamMembers,
    loading,
    error,
    refetch: fetchTeamMembers,
  };
};
