import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export interface FileDto {
  id: number;
  name: string;
  type: string;
  size: number;
  s3BucketName: string;
  s3Key: string;
  createdAt: string;
  updatedAt: string;
}


export const useFetchFileById = (fileId: number | string | undefined) => {
  return useQuery({
    queryKey: ["filesById", fileId],
    queryFn: async () => {
      if (fileId == null) {
  
        throw new Error("fileId is required");
      }

      const { data } = await api.get("/files/filesById", {
        headers: { id: fileId },
      });

  
      return data;
    },

    enabled: !!fileId,
  
  });
};