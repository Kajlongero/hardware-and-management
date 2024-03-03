type Props = {
  children: React.ReactNode | React.ReactNode[] | JSX.Element | JSX.Element[];
  position: "left" | "center" | "right";
  full?: boolean;
};

export const ItemsContainer = ({
  children,
  position = "left",
  full,
}: Props) => {
  return (
    <section
      className={`flex ${full ? "w-full flex-1" : ""} ${
        position === "right"
          ? "ml-auto"
          : position === "center"
          ? "mx-auto"
          : "mr-auto"
      } items-center gap-4`}
    >
      {children}
    </section>
  );
};
