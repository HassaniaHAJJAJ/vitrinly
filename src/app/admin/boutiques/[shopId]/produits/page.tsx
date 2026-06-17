export default async function ShopProductsAdminPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  return <div>Produits de la boutique {shopId}</div>;
}
