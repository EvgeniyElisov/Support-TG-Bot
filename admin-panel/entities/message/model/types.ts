export type MessageRecord = {
  id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  text_content: string | null;
  caption: string | null;
};
