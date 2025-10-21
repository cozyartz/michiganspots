/**
 * PDF Generation System
 *
 * Generates branded partnership agreement PDFs with signature pages.
 * Uploads to Cloudflare R2 for permanent storage.
 *
 * DEPENDENCIES REQUIRED:
 * npm install pdf-lib
 *
 * For R2 storage, ensure wrangler.toml has:
 * [[r2_buckets]]
 * binding = "R2"
 * bucket_name = "michigan-spots-legal-documents"
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { logLegalEvent } from './legalAuditLog';

interface PartnershipDetails {
  partnerName: string;
  organizationName: string;
  email: string;
  phone: string;
  address: string;
  tier: string;
  duration: string;
  pricing: {
    amount: number;
    interval: string;
  };
}

interface SignatureDetails {
  fullName: string;
  title: string;
  signedDate: string;
  ipAddress: string;
  userAgent?: string;
}

export interface AgreementPDFData {
  agreementHtml: string;
  agreementVersion: string;
  partnershipDetails: PartnershipDetails;
  signatureDetails?: SignatureDetails; // Optional for unsigned PDFs
}

/**
 * Generate partnership agreement PDF
 */
export async function generateAgreementPDF(data: AgreementPDFData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add cover page
  const coverPage = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = coverPage.getSize();

  // Title
  coverPage.drawText('PARTNERSHIP AGREEMENT', {
    x: 50,
    y: height - 100,
    size: 24,
    font: timesRomanBold,
    color: rgb(0.18, 0.31, 0.47) // Michigan Spots blue #2E5077
  });

  // Partnership details
  let yPos = height - 160;
  const lineHeight = 20;

  coverPage.drawText(`Partner: ${data.partnershipDetails.organizationName}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica
  });

  yPos -= lineHeight;
  coverPage.drawText(`Contact: ${data.partnershipDetails.partnerName}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica
  });

  yPos -= lineHeight;
  coverPage.drawText(`Email: ${data.partnershipDetails.email}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica
  });

  yPos -= lineHeight;
  coverPage.drawText(`Tier: ${data.partnershipDetails.tier}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica
  });

  yPos -= lineHeight;
  coverPage.drawText(`Duration: ${data.partnershipDetails.duration}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica
  });

  yPos -= lineHeight;
  coverPage.drawText(
    `Investment: $${data.partnershipDetails.pricing.amount} / ${data.partnershipDetails.pricing.interval}`,
    {
      x: 50,
      y: yPos,
      size: 12,
      font: helvetica
    }
  );

  yPos -= lineHeight * 2;
  coverPage.drawText(`Agreement Version: ${data.agreementVersion}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: timesRomanFont
  });

  yPos -= lineHeight;
  coverPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: timesRomanFont
  });

  // Footer
  coverPage.drawText('Michigan Spots - A Cozyartz Media Group Production', {
    x: 50,
    y: 50,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Add agreement content pages (simplified - would convert HTML to PDF properly)
  // NOTE: For production, use a proper HTML-to-PDF converter or render service
  const agreementPages = splitTextIntoPages(data.agreementHtml, timesRomanFont, 12);

  agreementPages.forEach((pageText) => {
    const page = pdfDoc.addPage([612, 792]);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    page.drawText(pageText, {
      x: 50,
      y: pageHeight - 50,
      size: 11,
      font: timesRomanFont,
      maxWidth: pageWidth - 100,
      lineHeight: 16
    });
  });

  // Add signature page if signature details provided
  if (data.signatureDetails) {
    const signaturePage = pdfDoc.addPage([612, 792]);
    const { width: sigWidth, height: sigHeight } = signaturePage.getSize();

    let sigY = sigHeight - 100;

    signaturePage.drawText('ELECTRONIC SIGNATURE', {
      x: 50,
      y: sigY,
      size: 18,
      font: timesRomanBold
    });

    sigY -= 40;
    signaturePage.drawText('Partner Signature:', {
      x: 50,
      y: sigY,
      size: 12,
      font: helvetica
    });

    sigY -= 30;
    signaturePage.drawText(data.signatureDetails.fullName, {
      x: 50,
      y: sigY,
      size: 14,
      font: timesRomanBold
    });

    sigY -= 25;
    signaturePage.drawText(`Title: ${data.signatureDetails.title}`, {
      x: 50,
      y: sigY,
      size: 11,
      font: helvetica
    });

    sigY -= 20;
    signaturePage.drawText(`Date: ${data.signatureDetails.signedDate}`, {
      x: 50,
      y: sigY,
      size: 11,
      font: helvetica
    });

    sigY -= 20;
    signaturePage.drawText(`IP Address: ${data.signatureDetails.ipAddress}`, {
      x: 50,
      y: sigY,
      size: 9,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Electronic signature acknowledgment
    sigY -= 60;
    const acknowledgment = `This electronic signature is legally binding and has the same force and effect as a handwritten signature.`;

    signaturePage.drawText(acknowledgment, {
      x: 50,
      y: sigY,
      size: 9,
      font: timesRomanFont,
      maxWidth: sigWidth - 100,
      lineHeight: 14,
      color: rgb(0.3, 0.3, 0.3)
    });
  }

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Upload PDF to Cloudflare R2
 */
export async function uploadPDFToR2(
  r2Bucket: R2Bucket,
  pdfBytes: Uint8Array,
  partnershipActivationId: number,
  documentType: 'unsigned' | 'signed'
): Promise<{ url: string; storageKey: string }> {
  const timestamp = Date.now();
  const storageKey = `agreements/${partnershipActivationId}/${documentType}_${timestamp}.pdf`;

  await r2Bucket.put(storageKey, pdfBytes, {
    httpMetadata: {
      contentType: 'application/pdf'
    },
    customMetadata: {
      partnershipActivationId: partnershipActivationId.toString(),
      documentType,
      uploadedAt: new Date().toISOString()
    }
  });

  // Generate public URL (adjust based on your R2 public access configuration)
  const url = `https://legal-docs.michiganspots.com/${storageKey}`;

  return { url, storageKey };
}

/**
 * Retrieve PDF from R2
 */
export async function getPDFFromR2(
  r2Bucket: R2Bucket,
  storageKey: string
): Promise<Uint8Array | null> {
  const object = await r2Bucket.get(storageKey);

  if (!object) {
    return null;
  }

  const arrayBuffer = await object.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Helper: Split text into pages (simplified)
 * In production, use proper HTML-to-PDF rendering
 */
function splitTextIntoPages(html: string, font: any, fontSize: number): string[] {
  // Strip HTML tags for simplicity (in production, render HTML properly)
  const plainText = html.replace(/<[^>]*>/g, '').trim();

  const maxCharsPerPage = 3000; // Approximate
  const pages: string[] = [];

  for (let i = 0; i < plainText.length; i += maxCharsPerPage) {
    pages.push(plainText.substring(i, i + maxCharsPerPage));
  }

  return pages;
}

/**
 * Generate and store complete partnership agreement PDF
 */
export async function generateAndStorePDF(
  db: D1Database,
  r2Bucket: R2Bucket,
  partnershipActivationId: number,
  data: AgreementPDFData
): Promise<{ url: string; storageKey: string }> {
  // Generate PDF
  const pdfBytes = await generateAgreementPDF(data);

  // Upload to R2
  const documentType = data.signatureDetails ? 'signed' : 'unsigned';
  const { url, storageKey } = await uploadPDFToR2(
    r2Bucket,
    pdfBytes,
    partnershipActivationId,
    documentType
  );

  // Log to audit trail
  await logLegalEvent(db, {
    eventType: 'agreement_pdf_generated',
    partnershipActivationId,
    metadata: {
      storageKey,
      documentType,
      fileSize: pdfBytes.length
    }
  });

  await logLegalEvent(db, {
    eventType: 'agreement_pdf_uploaded',
    partnershipActivationId,
    metadata: {
      url,
      storageKey
    }
  });

  return { url, storageKey };
}
