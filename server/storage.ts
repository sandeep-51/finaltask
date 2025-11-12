import type { Registration, InsertRegistration } from "@shared/schema";
import { ticketDb } from "./mongodb";

export interface ScanHistory {
  id: string;
  ticketId: string;
  timestamp: Date;
  // Add any other relevant fields for scan history
}

export interface IStorage {
  createRegistration(data: InsertRegistration): Promise<Registration>;
  getRegistration(id: string): Promise<Registration | undefined>;
  getAllRegistrations(limit?: number, offset?: number): Promise<Registration[]>;
  getRegistrationsCount(): Promise<number>;
  generateQRCode(id: string, qrCodeData: string): Promise<boolean>;
  verifyAndScan(ticketId: string): Promise<{ valid: boolean; registration?: Registration; message: string }>;
  getStats(): Promise<{
    totalRegistrations: number;
    qrCodesGenerated: number;
    totalEntries: number;
    activeRegistrations: number;
  }>;
  createEventForm(data: any): Promise<any>;
  getEventForm(id: number): Promise<any>;
  getPublishedForm(): Promise<any>;
  getAllEventForms(): Promise<any[]>;
  updateEventForm(id: number, data: any): Promise<boolean>;
  publishEventForm(id: number): Promise<boolean>;
  unpublishEventForm(id: number): Promise<boolean>;
  deleteEventForm(id: number): Promise<boolean>;
  getScanHistory(limit?: number): Promise<ScanHistory[]>;
  getScanHistoryByTicketId(ticketId: string): Promise<ScanHistory[]>;
  exportToCSV(registrations: Registration[]): string;
  exportToPDF(registrations: Registration[]): Promise<Buffer>;
  exportToExcel(registrations: Registration[]): Buffer;
}

export class SqliteStorage implements IStorage {
  async createRegistration(data: InsertRegistration): Promise<Registration> {
    return ticketDb.createRegistration(data);
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    return ticketDb.getRegistration(id);
  }

  async getAllRegistrations(limit?: number, offset?: number): Promise<Registration[]> {
    return ticketDb.getAllRegistrations(limit, offset);
  }

  async getRegistrationsCount(): Promise<number> {
    return ticketDb.getRegistrationsCount();
  }

  async getRegistrationsByFormId(formId: number, limit?: number, offset?: number): Promise<Registration[]> {
    return ticketDb.getRegistrationsByFormId(formId, limit, offset);
  }

  async getRegistrationsByFormIdCount(formId: number): Promise<number> {
    return ticketDb.getRegistrationsByFormIdCount(formId);
  }

  async getFormStats(formId: number) {
    return ticketDb.getFormStats(formId);
  }

  async generateQRCode(id: string, qrCodeData: string): Promise<boolean> {
    return ticketDb.generateQRCode(id, qrCodeData);
  }

  async verifyAndScan(ticketId: string): Promise<{ valid: boolean; registration?: Registration; message: string }> {
    const registration = await ticketDb.getRegistration(ticketId);

    if (!registration) {
      return { valid: false, message: "Ticket not found." };
    }

    if (registration.scans >= registration.maxScans) {
      return { valid: false, message: "This ticket has reached its maximum scan limit." };
    }

    // Update scan count and status
    const newScans = registration.scans + 1;
    // Once checked-in, keep status as checked-in permanently
    const newStatus = registration.status === "checked-in" ? "checked-in" : "checked-in";

    // Save scan history
    await ticketDb.createScanHistory({ ticketId, timestamp: new Date(), /* other fields */ });

    await ticketDb.updateRegistration(ticketId, {
      scans: newScans,
      status: newStatus
    });

    return {
      valid: true,
      registration: { ...registration, scans: newScans, status: newStatus },
      message: "Ticket verified and scanned successfully."
    };
  }

  async getStats() {
    return ticketDb.getStats();
  }

  async deleteRegistration(id: string): Promise<boolean> {
    return ticketDb.deleteRegistration(id);
  }

  async revokeQRCode(id: string): Promise<boolean> {
    return ticketDb.revokeQRCode(id);
  }

  async updateRegistration(id: string, data: Partial<InsertRegistration>): Promise<boolean> {
    return ticketDb.updateRegistration(id, data);
  }

  async createEventForm(data: any) {
    return ticketDb.createEventForm(data);
  }

  async getEventForm(id: number) {
    return ticketDb.getEventForm(id);
  }

  async getPublishedForm() {
    return ticketDb.getPublishedForm();
  }

  async getAllEventForms() {
    return ticketDb.getAllEventForms();
  }

  async updateEventForm(id: number, data: any) {
    return ticketDb.updateEventForm(id, data);
  }

  async publishEventForm(id: number) {
    return ticketDb.publishEventForm(id);
  }

  async unpublishEventForm(id: number) {
    return ticketDb.unpublishEventForm(id);
  }

  async deleteEventForm(id: number) {
    return ticketDb.deleteEventForm(id);
  }

  async getScanHistory(limit?: number): Promise<ScanHistory[]> {
    return ticketDb.getScanHistory(limit);
  }

  async getScanHistoryByTicketId(ticketId: string): Promise<ScanHistory[]> {
    return ticketDb.getScanHistoryByTicketId(ticketId);
  }

  exportToCSV(registrations: Registration[]): string {
    const allCustomFieldKeys = new Set<string>();
    registrations.forEach(r => {
      if (r.customFieldData && Object.keys(r.customFieldData).length > 0) {
        Object.keys(r.customFieldData).forEach(key => allCustomFieldKeys.add(key));
      }
    });

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Organization', 'Group Size', 'Scans', 'Max Scans', 'Has QR', 'Status', 'Created At', 'Team Members', ...Array.from(allCustomFieldKeys)];
    const rows = registrations.map(r => {
      const teamMembersStr = r.teamMembers && r.teamMembers.length > 0
        ? r.teamMembers.map(m => `${m.name} (${m.email || 'N/A'})`).join('; ')
        : '';

      const baseRow = [
        r.id,
        r.name,
        r.email,
        r.phone,
        r.organization,
        r.groupSize.toString(),
        r.scans.toString(),
        r.maxScans.toString(),
        r.hasQR ? 'Yes' : 'No',
        r.status,
        r.createdAt,
        teamMembersStr
      ];

      const customFieldValues = Array.from(allCustomFieldKeys).map(key => {
        return (r.customFieldData && r.customFieldData[key]) || '';
      });

      return [...baseRow, ...customFieldValues];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  async exportToPDF(registrations: Registration[]): Promise<Buffer> {
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // Account for margins

      // Title
      doc.fontSize(22).font('Helvetica-Bold').text('Event Registration Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      // Summary stats in a box
      doc.rect(50, doc.y, pageWidth, 60).stroke();
      const statsY = doc.y + 10;
      doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics', 60, statsY);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Registrations: ${registrations.length}`, 60, statsY + 20);
      doc.text(`Total Participants: ${registrations.reduce((sum, r) => sum + (r.groupSize || 1), 0)}`, 60, statsY + 35);
      doc.moveDown(3);

      // Registrations list
      doc.fontSize(16).font('Helvetica-Bold').text('Registration Details', { underline: true });
      doc.moveDown(1);

      registrations.forEach((reg, index) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        const startY = doc.y;

        // Registration header box
        doc.rect(50, startY, pageWidth, 25).fillAndStroke('#f0f0f0', '#cccccc');
        doc.fillColor('#000000');
        doc.fontSize(12).font('Helvetica-Bold')
           .text(`Registration #${index + 1}: ${reg.name}`, 60, startY + 8);
        doc.fontSize(9).font('Helvetica')
           .text(`ID: ${reg.id}`, pageWidth - 80, startY + 8, { width: 100, align: 'right' });

        doc.moveDown(1.5);

        // Basic Information
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333')
           .text('Basic Information', 60);
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(`Email: ${reg.email}`, 70);
        doc.text(`Phone: ${reg.phone}`, 70);
        doc.text(`Organization: ${reg.organization}`, 70);
        doc.text(`Group Size: ${reg.groupSize} | Status: ${reg.status.toUpperCase()} | Scans Used: ${reg.scans}/${reg.maxScans}`, 70);
        doc.moveDown(0.5);

        // Team Members Section
        if (reg.teamMembers && reg.teamMembers.length > 0) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333')
             .text('Team Members', 60);
          doc.fontSize(9).font('Helvetica').fillColor('#000000');

          reg.teamMembers.forEach((member: any, idx: number) => {
            doc.text(`${idx + 1}. ${member.name}`, 70);
            if (member.email) {
              doc.text(`   Email: ${member.email}`, 80);
            }
            if (member.phone) {
              doc.text(`   Phone: ${member.phone}`, 80);
            }

            // Display custom fields for team members
            Object.entries(member).forEach(([key, value]) => {
              if (key !== 'name' && key !== 'email' && key !== 'phone' && value) {
                const fieldLabel = key.replace(/^member_field_/, 'Field ');
                doc.text(`   ${fieldLabel}: ${value}`, 80);
              }
            });

            if (idx < reg.teamMembers.length - 1) {
              doc.moveDown(0.3);
            }
          });
          doc.moveDown(0.5);
        }

        // Custom Fields Section
        if (reg.customFieldData && Object.keys(reg.customFieldData).length > 0) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333')
             .text('Additional Information', 60);
          doc.fontSize(9).font('Helvetica').fillColor('#000000');

          Object.entries(reg.customFieldData).forEach(([key, value]) => {
            const fieldLabel = key.replace(/^field_/, 'Field ');
            const displayValue = String(value).startsWith('/attached_assets/')
              ? `[Photo: ${value}]`
              : value;
            doc.text(`${fieldLabel}: ${displayValue}`, 70);
          });
          doc.moveDown(0.5);
        }

        // Divider line
        doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke();
        doc.moveDown(1);
      });

      // Footer on last page
      const footerY = doc.page.height - 50;
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
         .text(`End of Report - ${registrations.length} registrations`, 50, footerY, { align: 'center' });

      doc.end();
    });
  }

  exportToExcel(registrations: Registration[]): Buffer {
    const XLSX = require('xlsx') as typeof import('xlsx');

    const rows = registrations.map((r) => {
      const teamMembersStr = r.teamMembers && r.teamMembers.length > 0
        ? r.teamMembers.map(m => `${m.name}${m.email ? ` (${m.email})` : ''}${m.phone ? ` - ${m.phone}` : ''}`).join('; ')
        : '';

      const row: any = {
        ID: r.id,
        Name: r.name,
        Email: r.email,
        Phone: r.phone,
        Organization: r.organization,
        'Group Size': r.groupSize,
        'Scans Used': r.scans,
        'Max Scans': r.maxScans,
        'Has QR': r.hasQR ? 'Yes' : 'No',
        Status: r.status,
        'Created At': r.createdAt,
        'Team Members': teamMembersStr,
      };

      if (r.customFieldData && Object.keys(r.customFieldData).length > 0) {
        Object.entries(r.customFieldData).forEach(([key, value]) => {
          row[key] = value;
        });
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const storage = ticketDb;