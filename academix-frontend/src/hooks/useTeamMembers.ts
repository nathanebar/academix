import { useState, useEffect } from "react";
import axios from "axios";
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
      const response = await axios.get<TeamMember[]>(
        `${process.env.REACT_APP_API_BASE_URL}/teamMembers/getUsersTeam/${teamId}/${courseBatchId}`
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
