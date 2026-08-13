import { useAuth } from "../auth/AuthContext";
import { Link } from "./Link";

export const Logo = () => {
  const { session } = useAuth();

  return (
    <Link className="logo" to={session ? "/dashboard" : "/"}>
      <img className="logo-mark" src="/focusflow-mark.svg" alt="" />
      <span>FocusFlow</span>
    </Link>
  );
};
