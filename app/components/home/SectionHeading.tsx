type SectionHeadingProps = {
  title: string;
  description?: string;
  id?: string;
};

export default function SectionHeading({
  title,
  description,
  id,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <h2
        id={id}
        className="text-3xl font-semibold leading-tight tracking-tight text-ow-text sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-ow-muted sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}
