import { redirect } from "next/navigation";
import { getSessionUser } from "@/core/auth/session";
import { MessagesWorkspace } from "@/features/messaging/presentation/messages-workspace";

interface PageProps {
  searchParams?: Promise<{ c?: string }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  const params = searchParams ? await searchParams : {};

  return (
    <div className="workspace">
      <main className="workspace__main" id="main">
        <h1 className="card__title">Messages</h1>
        <MessagesWorkspace
          user={user}
          basePath="/messages"
          requestedId={params.c ?? null}
        />
      </main>
    </div>
  );
}
