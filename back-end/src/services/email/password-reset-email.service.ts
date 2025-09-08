import { CoreEmailService } from "./core-email.service";
import { PasswordResetEmail } from "./templates/password-reset-email";
import { createLogoAttachment } from "./utils/logo-attachment";
import React from "react";

export class PasswordResetEmailService {
  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toLocaleString(); // 24 hours from now

    const { frontendUrl } = CoreEmailService.getConfig();

    const emailTemplate = React.createElement(PasswordResetEmail, {
      userName,
      expiresAt,
      frontendUrl,
      token: resetToken,
    });

    const logoAttachment = createLogoAttachment();

    await CoreEmailService.sendEmail({
      to,
      subject: "Reset your password - RabbitMQ Dashboard",
      template: emailTemplate,
      emailType: "password-reset",
      attachments: [logoAttachment],
      context: {
        userName,
        resetToken: resetToken.substring(0, 8) + "...", // Log partial token for debugging
      },
    });
  }
}

export const passwordResetEmailService = PasswordResetEmailService;
