import { MailtrapClient } from "mailtrap";
import { Resend } from "resend";

import { configuration } from "./config";
import { deliverOnce } from "./email-delivery";
import { emailMessage } from "./email-message";
import { sha256 } from "./hash";
import { sendMailpit } from "./mailpit";
import { devOutbox } from "./schema/crm";

import type { Database } from "./db";
import type { EmailMessage, EmailSender } from "./email-message";

class OutboxEmailSender implements EmailSender {
  constructor(private readonly db: Database) {}
  async send(input: EmailMessage): Promise<void> {
    const message = emailMessage.parse(input);
    await this.db
      .insert(devOutbox)
      .values({ id: crypto.randomUUID(), ...message })
      .onConflictDoNothing({ target: devOutbox.idempotencyKey });
  }
}
class ProviderEmailSender implements EmailSender {
  constructor(
    private readonly db: Database,
    private readonly deliver: (message: EmailMessage) => Promise<string>,
  ) {}
  async send(input: EmailMessage): Promise<void> {
    const message = emailMessage.parse(input);
    await deliverOnce(this.db, message, () => this.deliver(message));
  }
}
export function emailSender(env: Env, db: Database): EmailSender {
  const config = configuration(env).mail;
  switch (config.driver) {
    case "outbox":
      return new OutboxEmailSender(db);
    case "mailpit": {
      const url = config.mailpit.url;
      if (!url) throw new Error("The local email inbox is not configured.");
      return new ProviderEmailSender(db, (message) =>
        sendMailpit(url, config.from, message),
      );
    }
    case "mailtrap": {
      const token = config.mailtrap.token;
      const inbox = config.mailtrap.inboxId;
      if (!token || !inbox)
        throw new Error("The staging email sandbox is not configured.");
      return new ProviderEmailSender(db, async (message) => {
        const result = await new MailtrapClient({
          token,
          sandbox: true,
          testInboxId: inbox,
        }).send({
          from: { email: config.from, name: "TrailerDesk" },
          to: [{ email: message.recipient }],
          subject: message.subject,
          text: message.body,
        });
        const id = result.message_ids[0];
        if (!id) throw new Error("The staging email was not accepted.");
        return id;
      });
    }
    case "resend": {
      const key = config.resend.apiKey;
      if (!key) throw new Error("Email is not configured.");
      return new ProviderEmailSender(db, async (message) => {
        const result = await new Resend(key).emails.send(
          {
            from: `TrailerDesk <${config.from}>`,
            to: message.recipient,
            subject: message.subject,
            text: message.body,
          },
          { idempotencyKey: await sha256(message.idempotencyKey) },
        );
        if (result.error) throw new Error("The email could not be sent.");
        return result.data.id;
      });
    }
  }
}
