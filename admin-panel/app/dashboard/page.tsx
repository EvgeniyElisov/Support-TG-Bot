import { MessagesPage } from "@/views/messages";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  return <MessagesPage searchParams={searchParams} />;
}
