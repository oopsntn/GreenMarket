type PlaceholderPageProps = {
  title: string;
};

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <h2>{title}</h2>
      <p>Màn này đang được hoàn thiện.</p>
    </div>
  );
}

export default PlaceholderPage;
