import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants/brand";
import { EmailHeader } from "./email-header";
import { EmailFooter } from "./email-footer";

export interface EmailLayoutProps {
  /** Used by Gmail/Outlook as the inbox preview snippet. */
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 16px",
          backgroundColor: BRAND.colors.background,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          color: BRAND.colors.text,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            backgroundColor: BRAND.colors.surface,
            borderRadius: 14,
            border: `1px solid ${BRAND.colors.border}`,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(40, 42, 42, 0.04)",
          }}
        >
          <EmailHeader />
          <Section style={{ padding: "28px 32px 8px" }}>{children}</Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
