import { Link } from "./Link";

export const Logo = () => (
  <Link className="logo" to="/">
    <span className="logo-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
    <span>FocusFlow</span>
  </Link>
);
