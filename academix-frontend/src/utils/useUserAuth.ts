import { useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";
import { fetchMe, fetchUser, getAuthMode, storeUserInfo } from "../services/ntlmService";

// "loading" : en cours | "ready" : l'app peut s'afficher | "login" : afficher la page de connexion
export type AuthStatus = "loading" | "ready" | "login";

export const useUserAuth = (): AuthStatus => {
  const { setUser, setAuthMode } = useUserStore();
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const loadUser = async () => {
      const mode = await getAuthMode();
      setAuthMode(mode);

      if (mode === "local") {
        // Connexion username/password : session portée par le cookie JWT
        const me = await fetchMe();
        if (me) {
          setUser(me);
          storeUserInfo(me);
          setStatus("ready");
        } else {
          localStorage.removeItem("userInfo");
          setStatus("login");
        }
        return;
      }

      // NTLM (réseau fermé) : comportement d'origine, l'app s'affiche tout de suite
      setStatus("ready");
      try {
        const ntlmUser = await fetchUser();
        if (ntlmUser) {
          setUser(ntlmUser);
        } else {
          console.log("No user found");
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };

    loadUser();
  }, [setUser, setAuthMode]);

  return status;
};
