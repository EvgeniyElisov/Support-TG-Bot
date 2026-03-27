import { MessagesPage } from "@/pages-layer/messages-page";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  return <MessagesPage searchParams={searchParams} />;
}
