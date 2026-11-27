export interface MailTemplate {
  subject: string;
  text: string;
}

export function unreadMessageAlert(input: {
  recipientName: string;
  senderName: string;
  thesisTitle: string;
  link: string;
}): MailTemplate {
  return {
    subject: `New message from ${input.senderName}`,
    text: [
      `Hello ${input.recipientName},`,
      "",
      `${input.senderName} sent you a message about "${input.thesisTitle}".`,
      `Read it here: ${input.link}`,
    ].join("\n"),
  };
}
