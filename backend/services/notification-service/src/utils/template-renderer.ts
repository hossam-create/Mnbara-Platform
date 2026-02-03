/**
 * Template Renderer
 * Renders email templates using Handlebars
 */

import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

const templatesDir = path.join(__dirname, '../templates');

interface TemplateResult {
  subject: string;
  html: string;
  text: string;
}

/**
 * Render email template
 */
export async function renderTemplate(
  templateName: string,
  data: any,
): Promise<TemplateResult> {
  try {
    // Read template files
    const htmlPath = path.join(templatesDir, `${templateName}.html`);
    const textPath = path.join(templatesDir, `${templateName}.txt`);
    const metaPath = path.join(templatesDir, `${templateName}.json`);

    const [htmlTemplate, textTemplate, metaContent] = await Promise.all([
      fs.readFile(htmlPath, 'utf-8'),
      fs.readFile(textPath, 'utf-8').catch(() => ''),
      fs.readFile(metaPath, 'utf-8'),
    ]);

    const meta = JSON.parse(metaContent);

    // Compile templates
    const htmlCompiled = Handlebars.compile(htmlTemplate);
    const textCompiled = textTemplate ? Handlebars.compile(textTemplate) : null;

    // Render
    const html = htmlCompiled(data);
    const text = textCompiled ? textCompiled(data) : '';
    const subject = Handlebars.compile(meta.subject)(data);

    return { subject, html, text };
  } catch (error) {
    throw new Error(`Template rendering failed: ${error}`);
  }
}

/**
 * Register Handlebars helpers
 */
Handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString();
});

Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
});
