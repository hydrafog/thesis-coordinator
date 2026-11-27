import nodemailer, { type Transporter } from "nodemailer";
import { getMailConfig } from "@/core/config/app-config";
import { errorContext, logger } from "@/core/logging/logger";

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const config = getMailConfig();
  if (!config.host) {
    return null;
  }
  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth:
      config.user && config.password
        ? { user: config.user, pass: config.password }
        : undefined,
  });
  return transporter;
}

export async function sendMail(mail: OutgoingMail): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    logger.warn("mail skipped: SMTP_HOST is not configured");
    return false;
  }
  try {
    await transport.sendMail({ from: getMailConfig().from, ...mail });
    return true;
  } catch (error) {
    logger.error("mail delivery failed", errorContext(error));
    return false;
  }
}
