import { ChatClient } from "@/components/chat/ChatClient";
import type { Metadata } from "next";

type Props = Readonly<{
  params: Promise<{ zip: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `FireLink — Help chat · ${zip}`,
    description:
      "SMS-style help chat with the FireLink agent. Auto-detects emergencies and dispatches mock 911.",
  };
}

export default async function ChatPage({ params }: Props) {
  await params;
  return <ChatClient />;
}
