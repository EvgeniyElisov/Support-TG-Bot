import { getMessagesPageData } from "../model/get-messages-page-data";
import { View } from "./view";

type MessagesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function MessagesPage({ searchParams }: MessagesPageProps) {
  const data = await getMessagesPageData(searchParams);
  return <View data={data} />;
}
