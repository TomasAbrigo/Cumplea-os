import PlayView from "./PlayView";

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PlayView code={code.toUpperCase()} />;
}
