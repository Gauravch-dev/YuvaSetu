/**
 * Resume PDF Generator
 * - Uses html2pdf.js as primary exporter
 * - Falls back to window.print() if PDF exceeds 1 page
 * - ATS-friendly template
 */

import type { OnboardingData } from '@/contexts/OnboardingContext';

// Print-optimized CSS for fallback
const PRINT_STYLES = `
@media print {
  @page { 
    size: A4; 
    margin: 0.5in; 
  }
  body { 
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact;
  }
  .resume-pdf {
    max-height: 10.5in !important;
    overflow: hidden !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
  }
}
`;

/**
 * Generate resume HTML from onboarding data
 */
function generateResumeHTML(data: OnboardingData): string {
  const { personalInfo, education, experience, projects, certifications, skills } = data;

  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);
  if (personalInfo.github) contactParts.push(personalInfo.github);

  return `
    <div class="resume-pdf" style="
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #1a1a1a;
      max-width: 8.5in;
      padding: 0.5in;
      background: white;
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 16px; border-bottom: 1px solid #333; padding-bottom: 12px;">
        <h1 style="font-size: 20pt; font-weight: bold; margin: 0 0 4px 0;">
          ${personalInfo.fullName || 'Your Name'}
        </h1>
        <p style="font-size: 9pt; color: #444; margin: 0;">
          ${contactParts.join(' | ') || 'email@example.com | +1234567890'}
        </p>
      </div>

      ${personalInfo.bio ? `
        <!-- Summary -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            SUMMARY
          </h2>
          <p style="font-size: 9pt; color: #333; margin: 0;">
            ${personalInfo.bio.slice(0, 150)}${personalInfo.bio.length > 150 ? '...' : ''}
          </p>
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <!-- Education -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            EDUCATION
          </h2>
          ${education.slice(0, 2).map(edu => `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <strong style="font-size: 10pt;">${edu.degree || 'Degree'}</strong>
                <span style="font-size: 9pt; color: #666;">${edu.year || ''}</span>
              </div>
              <div style="font-size: 9pt; color: #666;">
                ${edu.institution}${edu.score ? ` | ${edu.score}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${experience.length > 0 ? `
        <!-- Experience -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            EXPERIENCE
          </h2>
          ${experience.slice(0, 3).map(exp => `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <strong style="font-size: 10pt;">${exp.role || 'Role'}</strong>
                <span style="font-size: 9pt; color: #666;">${exp.duration || ''}</span>
              </div>
              <div style="font-size: 9pt; color: #666; margin-bottom: 4px;">${exp.company || ''}</div>
              ${exp.description ? `
                <ul style="font-size: 9pt; margin: 0; padding-left: 16px; color: #333;">
                  ${exp.description.split('\n').slice(0, 3).map(line =>
    `<li>${line.trim()}</li>`
  ).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${projects && projects.length > 0 ? `
        <!-- Projects -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            PROJECTS
          </h2>
          ${projects.slice(0, 2).map(proj => `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <strong style="font-size: 10pt;">${proj.title}</strong>
                ${proj.technologies ? `<span style="font-size: 9pt; color: #666;">${proj.technologies}</span>` : ''}
              </div>
              ${proj.description ? `
                <ul style="font-size: 9pt; margin: 0; padding-left: 16px; color: #333;">
                  ${proj.description.split('\n').slice(0, 2).map(line =>
    `<li>${line.trim()}</li>`
  ).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${certifications && certifications.length > 0 ? `
        <!-- Certifications -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            CERTIFICATIONS & ACHIEVEMENTS
          </h2>
          <ul style="font-size: 9pt; margin: 0; padding-left: 16px; color: #333;">
            ${certifications.slice(0, 4).map(cert =>
    `<li>${cert.title}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}</li>`
  ).join('')}
          </ul>
        </div>
      ` : ''}

      ${skills && skills.length > 0 ? `
        <!-- Skills -->
        <div>
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            SKILLS
          </h2>
          <p style="font-size: 9pt; color: #333; margin: 0;">
            ${skills.join(' • ')}
          </p>
        </div>
      ` : ''}

      ${personalInfo.languages ? `
        <!-- Languages -->
        <div style="margin-top: 12px;">
          <h2 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 0 0 8px 0;">
            LANGUAGES
          </h2>
          <p style="font-size: 9pt; color: #333; margin: 0;">
            ${personalInfo.languages}
          </p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Export resume as PDF with one-page guarantee
 */
export async function exportResumeToPDF(data: OnboardingData, filename = 'resume.pdf'): Promise<{ success: boolean; usedFallback: boolean }> {
  try {
    // Dynamic import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;

    const html = generateResumeHTML(data);

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const element = container.querySelector('.resume-pdf') as HTMLElement;

    if (!element) {
      throw new Error('Resume element not found');
    }

    // Configure html2pdf options
    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: {
        unit: 'in',
        format: 'a4',
        orientation: 'portrait' as const
      },
      pagebreak: { mode: 'avoid-all' }
    };

    // Generate PDF
    const pdfInstance = html2pdf().set(opt).from(element);
    const pdf = await pdfInstance.toPdf().get('pdf');

    // Check page count
    const pageCount = pdf.getNumberOfPages();

    // Cleanup
    document.body.removeChild(container);

    if (pageCount > 1) {
      // Fallback to print
      console.warn('PDF exceeded 1 page, using print fallback');
      await printFallback(data);
      return { success: true, usedFallback: true };
    }

    // Save PDF
    await pdfInstance.save();
    return { success: true, usedFallback: false };

  } catch (error) {
    console.error('PDF generation failed:', error);
    // Try print fallback
    try {
      await printFallback(data);
      return { success: true, usedFallback: true };
    } catch {
      return { success: false, usedFallback: false };
    }
  }
}

/**
 * Print fallback for one-page guarantee
 */
async function printFallback(data: OnboardingData): Promise<void> {
  const html = generateResumeHTML(data);

  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resume - ${data.personalInfo.fullName}</title>
      <style>
        ${PRINT_STYLES}
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      ${html}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

export default exportResumeToPDF;
