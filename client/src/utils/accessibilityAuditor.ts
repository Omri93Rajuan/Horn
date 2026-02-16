/**
 * WCAG 2.1 AA Accessibility Audit Helper
 * 
 * Utility functions for testing accessibility compliance
 * Use in development/testing to identify accessibility issues
 * 
 * Israeli Standard 5568 Compliance Tool
 */

interface A11yIssue {
  element: Element;
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  wcagCriteria: string;
}

class AccessibilityAuditor {
  private issues: A11yIssue[] = [];

  /**
   * Run a complete accessibility audit on the current page
   */
  public audit(): A11yIssue[] {
    this.issues = [];

    this.checkFocusVisibility();
    this.checkHeadingStructure();
    this.checkImageAlt();
    this.checkFormLabels();
    this.checkColorContrast();
    this.checkAriaLabels();
    this.checkKeyboardNavigation();
    this.checkLiveRegions();

    return this.issues;
  }

  private checkFocusVisibility() {
    const interactiveElements = document.querySelectorAll(
      "button, a, input, select, textarea, [role='button'], [role='link']"
    );

    interactiveElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const outlineStyle = styles.outlineStyle;
      const outline = styles.outline;

      // Check if element has proper focus visible styles
      if (outlineStyle === "none" && !outline.includes("auto")) {
        this.issues.push({
          element,
          rule: "Focus Visibility",
          severity: "warning",
          message: "Interactive element may not have visible focus indicator",
          wcagCriteria: "2.4.7 Focus Visible",
        });
      }
    });
  }

  private checkHeadingStructure() {
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);

      if (level > previousLevel + 1 && previousLevel > 0) {
        this.issues.push({
          element: heading,
          rule: "Heading Structure",
          severity: "warning",
          message: `Heading skipped from H${previousLevel} to H${level}`,
          wcagCriteria: "1.3.1 Info and Relationships",
        });
      }

      previousLevel = level;
    });

    if (headings.length === 0) {
      this.issues.push({
        element: document.body,
        rule: "Heading Structure",
        severity: "error",
        message: "Page has no headings",
        wcagCriteria: "1.3.1 Info and Relationships",
      });
    }
  }

  private checkImageAlt() {
    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      if (!img.alt || img.alt.trim() === "") {
        this.issues.push({
          element: img,
          rule: "Image Alt Text",
          severity: "error",
          message: "Image missing alt text",
          wcagCriteria: "1.1.1 Non-text Content",
        });
      }
    });
  }

  private checkFormLabels() {
    const inputs = document.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      const id = input.id;
      let hasLabel = false;

      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label && label.textContent?.trim()) {
          hasLabel = true;
        }
      }

      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");

      if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
        this.issues.push({
          element: input,
          rule: "Form Labels",
          severity: "error",
          message: "Form input missing associated label or aria-label",
          wcagCriteria: "3.3.2 Labels or Instructions",
        });
      }
    });
  }

  private checkColorContrast() {
    // Basic check - full color contrast testing requires color computation
    const textElements = document.querySelectorAll("body *");

    // This is a simplified check - for full WCAG AA compliance,
    // use dedicated tools like axe DevTools
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const bgColor = styles.backgroundColor;

      // Only warn if both are set and appear to be light colors
      if (
        color !== "rgba(0, 0, 0, 0)" &&
        bgColor !== "rgba(0, 0, 0, 0)" &&
        color !== "transparent" &&
        bgColor !== "transparent"
      ) {
        // Simplified check - this is not a full contrast analysis
        if (color.includes("255, 255, 255") && bgColor.includes("255, 255")) {
          this.issues.push({
            element,
            rule: "Color Contrast",
            severity: "warning",
            message: "Potential low contrast - use axe DevTools for detailed analysis",
            wcagCriteria: "1.4.3 Contrast (Minimum)",
          });
        }
      }
    });
  }

  private checkAriaLabels() {
    // Check custom roles have proper aria labels
    const customRoles = document.querySelectorAll(
      "[role='button'], [role='link'], [role='tab'], [role='menuitem']"
    );

    customRoles.forEach((element) => {
      const ariaLabel = element.getAttribute("aria-label");
      const ariaLabelledBy = element.getAttribute("aria-labelledby");
      const textContent = element.textContent?.trim();

      if (!ariaLabel && !ariaLabelledBy && !textContent) {
        this.issues.push({
          element,
          rule: "ARIA Labels",
          severity: "error",
          message: `Element with role="${element.getAttribute("role")}" missing accessible name`,
          wcagCriteria: "4.1.3 Name, Role, Value",
        });
      }
    });
  }

  private checkKeyboardNavigation() {
    // Check for tabindex usage
    const tabindexElements = document.querySelectorAll("[tabindex]");

    tabindexElements.forEach((element) => {
      const tabindex = element.getAttribute("tabindex");
      if (tabindex && parseInt(tabindex) > 0) {
        this.issues.push({
          element,
          rule: "Keyboard Navigation",
          severity: "warning",
          message: "Avoid using positive tabindex values",
          wcagCriteria: "2.4.3 Focus Order",
        });
      }
    });
  }

  private checkLiveRegions() {
    // Check that aria-live regions have aria-atomic
    const liveRegions = document.querySelectorAll("[aria-live]");

    liveRegions.forEach((region) => {
      const ariaAtomic = region.getAttribute("aria-atomic");
      if (!ariaAtomic) {
        this.issues.push({
          element: region,
          rule: "Live Regions",
          severity: "info",
          message: "aria-live region should have aria-atomic attribute",
          wcagCriteria: "4.1.3 Status Messages",
        });
      }
    });
  }

  /**
   * Print audit results to console
   */
  public printResults(issues: A11yIssue[] = this.issues) {
    console.group("%c♿ WCAG 2.1 AA Accessibility Audit Results", "color: #2563eb; font-weight: bold; font-size: 14px;");

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    const infos = issues.filter((i) => i.severity === "info");

    console.log(`Total Issues: ${issues.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    console.log(`ℹ️ Info: ${infos.length}`);
    console.groupEnd();

    if (errors.length > 0) {
      console.group("%c❌ ERRORS", "color: #dc2626; font-weight: bold;");
      errors.forEach((issue) => {
        console.log(`${issue.rule} (${issue.wcagCriteria})`);
        console.log(`Message: ${issue.message}`);
        console.log("Element:", issue.element);
      });
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group("%c⚠️ WARNINGS", "color: #ea580c; font-weight: bold;");
      warnings.forEach((issue) => {
        console.log(`${issue.rule} (${issue.wcagCriteria})`);
        console.log(`Message: ${issue.message}`);
      });
      console.groupEnd();
    }

    if (infos.length > 0) {
      console.group("%cℹ️ INFO", "color: #0891b2; font-weight: bold;");
      infos.forEach((issue) => {
        console.log(`${issue.rule} (${issue.wcagCriteria})`);
        console.log(`Message: ${issue.message}`);
      });
      console.groupEnd();
    }
  }

  /**
   * Check if page passes basic WCAG AA compliance
   */
  public passes(): boolean {
    const errors = this.issues.filter((i) => i.severity === "error");
    return errors.length === 0;
  }
}

// Export singleton instance
export const a11yAuditor = new AccessibilityAuditor();

// Expose in dev tools
if (import.meta.env.DEV) {
  (window as any).__a11yAuditor = {
    audit: () => {
      const issues = a11yAuditor.audit();
      a11yAuditor.printResults(issues);
      return issues;
    },
    passes: () => {
      a11yAuditor.audit();
      return a11yAuditor.passes();
    },
  };
  console.log("%c♿ Accessibility Auditor Ready", "color: #16a34a; font-weight: bold;");
  console.log("Run: __a11yAuditor.audit() to check for accessibility issues");
  console.log("Run: __a11yAuditor.passes() to verify WCAG AA compliance");
}

export default AccessibilityAuditor;
