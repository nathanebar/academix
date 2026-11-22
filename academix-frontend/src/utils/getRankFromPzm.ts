import api from "../api/axios";

export async function getRank(username: string): Promise<any> {
  if (username?.trim() === "") {
    return;
  }
  try {
    const res = await api.get(
      `/users/getUserData/${username}`,
      {
        withCredentials: true,
      }
    );
    return res.data.data[0]?.rank;
  } catch (error) {
    console.log(error);
  }
}
