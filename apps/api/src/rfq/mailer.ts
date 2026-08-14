import { createTransport, type Transporter } from "nodemailer";

/** CR/LF are the only header-injection vectors in MIME; strip them everywhere. */
export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]/g, " ").replace(/\s+/g, " ").trim();
}

export interface MailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
  readonly name: string;
}

export function createConsoleMailer(log: (message: MailMessage) => void = console.info): Mailer {
  return {
    name: "console",
    send: async (message) => {
      log(message);
    },
  };
}

export function createSmtpMailer(options: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}): Mailer {
  const transport: Transporter = createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    ...(options.user ? { auth: { user: options.user, pass: options.pass ?? "" } } : {}),
  });
  return {
    name: "smtp",
    send: async (message) => {
      await transport.sendMail({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
      });
    },
  };
}
