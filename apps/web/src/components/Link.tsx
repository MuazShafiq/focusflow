import { useEffect, type AnchorHTMLAttributes } from "react";

export const Link = ({
  to,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
  <a href={to} {...props} />
);

export const Navigate = ({
  to,
  replace = false,
}: {
  to: string;
  replace?: boolean;
}) => {
  useEffect(() => {
    if (replace) window.location.replace(to);
    else window.location.assign(to);
  }, [replace, to]);
  return null;
};

export const useNavigate = () => (to: string) => window.location.assign(to);
