import path from "path";
import fs from "fs";

/**
 * Logo attachment configuration for CID embedding
 */
export interface LogoAttachment {
  content: string;
  filename: string;
  contentId: string;
  contentType: string;
}

/**
 * Create logo attachment with CID for embedding in emails
 * This embeds the logo directly in the email instead of using external URLs
 */
export function createLogoAttachment(): LogoAttachment {
  // Path to the logo file in the project
  const logoPath = path.join(process.cwd(), "assets", "icon_rabbit.png");

  try {
    // Read the logo file as base64
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString("base64");

    return {
      content: logoBase64,
      filename: "rabbit-logo.png",
      contentId: "rabbit-logo", // This is the CID we'll reference in templates
      contentType: "image/png",
    };
  } catch (error) {
    console.warn(
      "Logo file not found locally, using fallback approach:",
      error
    );

    // Fallback: Use the hosted version (current approach)
    // In production, you might want to fetch and cache this
    return {
      content: "", // Empty content means Resend will fetch from path
      filename: "rabbit-logo.png",
      contentId: "rabbit-logo",
      contentType: "image/png",
    };
  }
}

/**
 * Get the CID reference for use in email templates
 * Use this in your <Img> components: src={getLogoSrc()}
 */
export function getLogoSrc(): string {
  return "cid:rabbit-logo";
}
