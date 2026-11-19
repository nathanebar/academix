import axios from "axios";

export async function getRank(username: string): Promise<any> {
  if (username?.trim() === "") {
    return;
  }
  try {
    const res = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/users/getUserData/${username}`,
      {
        withCredentials: true,
      }
    );
    return res.data.data[0]?.rank;
  } catch (error) {
    console.log(error);
  }
}
