import HostView from "./HostView";

export default async function HostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <HostView code={code.toUpperCase()} />;
}
