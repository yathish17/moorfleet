import { UnitDetailsPage } from "@/components/pages/unit-details-page";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UnitDetails({ params }: PageProps) {
  const { id } = await params;
  return <UnitDetailsPage unitId={id} />;
} 
