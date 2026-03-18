type PlaceholderPageProps = {
  title: string;
};

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <h2>{title}</h2>
      <p>This page is under development.</p>
    </div>
  );
}

export default PlaceholderPage;
