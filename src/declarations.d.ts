/* Ambient module declarations for external shader dependencies */

declare module "*.html?raw" {
  const content: string;
  export default content;
}

declare module "../tidecrest-hero/tidecrestDocument.js" {
  export const buildTidecrestDocument: (variant: any) => string;
}

declare module "../meridian-landing-page/meridianDocument.js" {
  export const buildMeridianDocument: (variant: any) => string;
}

declare module "../ascii-field/asciiFieldDocuments.js" {
  export const buildAsciiFieldDocument: (variant: any) => string;
}

declare module "../betawise-globe/betawiseGlobeDocument.js" {
  export const buildBetawiseGlobeDocument: (variant: any) => string;
}

declare module "../nocturne-hero/NocturneScene" {
  export const NOCTURNE_TITLES: Record<string, string>;
  export const NOCTURNE_VARIANTS: readonly string[];
  export const buildNocturneDocument: (variant: any, controls?: any) => string;
  export type NocturneVariant = string;
}

declare module "./sandboxedPageDocument" {
  export const buildSandboxedPageDocument: (options: any) => string;
}

declare module "../sylva-living-world/SylvaLivingWorldScene" {
  export const MAPLE_AUTUMN_STYLE: string;
  export const SAKURA_SUNSET_STYLE: string;
  export const SEQUOIA_MIST_STYLE: string;
  export const applyMapleAutumnVariant: (doc: string) => string;
  export const applySakuraSunsetVariant: (doc: string) => string;
  export const applySequoiaMistVariant: (doc: string) => string;
}

declare module "@designcodeio/threeui" {
  import type { ComponentType, CSSProperties } from "react";
  export interface SylvaHeroProps {
    variant?: "living-green" | "sakura-sunset" | "maple-autumn" | "sequoia-mist" | string;
    headingFont?: string;
    bodyFont?: string;
    headingWeight?: string | number;
    bodyWeight?: string | number;
    primaryColor?: string;
    headingSize?: number;
    bodySize?: number;
    headingLetterSpacing?: number;
    className?: string;
    style?: CSSProperties;
    [key: string]: any;
  }
  export const SylvaHero: ComponentType<SylvaHeroProps>;
  export const LandingPageFrame: ComponentType<any>;
}
