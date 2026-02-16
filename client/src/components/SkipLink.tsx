import React from "react";
import { useI18n } from "../i18n";

/**
 * SkipLink Component
 * 
 * WCAG 2.1 AA Compliance: 2.4.1 Bypass Blocks
 * Provides keyboard-only users with a way to skip navigation and jump to main content.
 * Visible on focus, hidden by default.
 * 
 * Usage:
 * <SkipLink targetId="main-content" />
 */

interface SkipLinkProps {
  targetId?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId = "main-content" }) => {
  const { t } = useI18n();

  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-link"
      aria-label={t("a11y.skip_to_main")}
    >
      {t("a11y.skip_to_main")}
    </a>
  );
};

export default SkipLink;
