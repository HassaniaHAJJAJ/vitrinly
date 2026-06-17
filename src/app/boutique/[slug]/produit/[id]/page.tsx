export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return (
    <div>
      Produit {id} de la boutique {slug}
    </div>
  );
}
