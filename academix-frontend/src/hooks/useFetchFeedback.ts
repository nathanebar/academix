import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchFeedback = (courseId:number,teamId:number) => {
    
    return useQuery({
        queryKey: ["feedbackGetAll",courseId,teamId],
        queryFn: async () => {
            try {
               
                
                const {data} = await api.get(
                    `${process.env.REACT_APP_API_BASE_URL}/feedback/getAll/${courseId}/${teamId}`
                );
                
        
                return data;
            } catch (error) {
                console.error('Error in queryFn:', error);
                throw error; // חשוב להחזיר את השגיאה
            }
        },
        meta:{

            onSuccess: (data: any) => {
              
            },
            
        },
       /*  onError: (error: any) => {
            console.log('Error occurred:', error);
        } */
    });
};
