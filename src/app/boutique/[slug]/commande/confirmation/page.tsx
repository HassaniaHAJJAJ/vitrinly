export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <div>Commande confirmée - boutique {slug}</div>;
}
