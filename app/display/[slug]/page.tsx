import { DisplayScreen } from './display-screen'

export default async function DisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <DisplayScreen slug={slug} />
}
