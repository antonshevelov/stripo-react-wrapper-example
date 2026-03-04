import type { StripoTemplate } from '../types/stripo';

const DEMO_TEMPLATE_HTML_URL =
  'https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Trigger%20newsletter%20mockup/Trigger%20newsletter%20mockup.html';

const DEMO_TEMPLATE_CSS_URL =
  'https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Trigger%20newsletter%20mockup/Trigger%20newsletter%20mockup.css';

async function fetchTemplatePart(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Unable to load template part from ${url}. Status: ${response.status}`,
    );
  }

  return response.text();
}

export async function loadDemoTemplate(): Promise<StripoTemplate> {
  const [html, css] = await Promise.all([
    fetchTemplatePart(DEMO_TEMPLATE_HTML_URL),
    fetchTemplatePart(DEMO_TEMPLATE_CSS_URL),
  ]);

  return { html, css };
}

export const fallbackTemplate: StripoTemplate = {
  html: '<html><body><h1>Stripo React wrapper</h1><p>Demo template fallback.</p></body></html>',
  css: 'body { font-family: Arial, sans-serif; }',
};
