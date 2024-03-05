import { socialMediaLinks } from "@/utils/links";

type Props = {
  position?: "left" | "center" | "right";
};

export const SocialMedia = ({ position = "left" }: Props) => {
  return (
    <ul
      className={`flex gap-4 text-pure-yellow text-sm ${
        position === "left"
          ? "justify-start"
          : position === "center"
          ? "justify-center"
          : "justify-end"
      }`}
    >
      {socialMediaLinks.map(({ name, href }) => (
        <li key={`social-media-link-${href}`}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
        </li>
      ))}
    </ul>
  );
};
