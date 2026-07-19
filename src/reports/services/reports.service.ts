import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

// ─── Brand Colors ──────────────────────────────────────────────────────────
const BRAND_PRIMARY = '#1A1A2E';    // deep navy
const BRAND_ACCENT = '#E94560';     // vibrant red
const BRAND_LIGHT = '#F5F5F5';
const BRAND_GREEN = '#27AE60';
const BRAND_RED = '#E74C3C';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReport(userId: string, type: string, format: 'PDF' | 'EXCEL' | 'CSV') {
    const data = await this.gatherReportData(userId, type);

    switch (format) {
      case 'EXCEL':
        return this.generateExcel(data, type);
      case 'CSV':
        return this.generateCsv(data, type);
      case 'PDF':
        return this.generatePdf(data, type);
      default:
        throw new Error('Unsupported format');
    }
  }

  private async gatherReportData(userId: string, type: string) {
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();

    const [incomes, expenses, loans, investments, goals, user, score] = await Promise.all([
      this.prisma.income.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.expense.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.investment.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.financialGoal.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
      this.prisma.scoreHistory.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    let filteredIncomes = incomes;
    let filteredExpenses = expenses;

    if (type === 'monthly') {
      filteredIncomes = incomes.filter(i =>
        dayjs(i.startDate || i.createdAt).isAfter(startOfMonth) &&
        dayjs(i.startDate || i.createdAt).isBefore(endOfMonth)
      );
      filteredExpenses = expenses.filter(e =>
        dayjs(e.expenseDate).isAfter(startOfMonth) &&
        dayjs(e.expenseDate).isBefore(endOfMonth)
      );
    }

    return { incomes: filteredIncomes, expenses: filteredExpenses, loans, investments, goals, user, score };
  }

  // ─── EXCEL ─────────────────────────────────────────────────────────────────
  private async generateExcel(data: any, type: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FINT - AI Financial Advisor';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } },
      alignment: { horizontal: 'center' },
    };

    const addStyledSheet = (name: string, columns: any[], rows: any[]) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = columns;
      sheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));
      rows.forEach(r => {
        const row = sheet.addRow(r);
        row.eachCell(cell => {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          };
        });
      });
      return sheet;
    };

    if (type === 'monthly' || type === 'annual') {
      addStyledSheet('Incomes', [
        { header: 'Source', key: 'title', width: 25 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount (₹)', key: 'amount', width: 16 },
        { header: 'Frequency', key: 'freq', width: 15 },
        { header: 'Date', key: 'date', width: 14 },
      ], data.incomes.map(i => ({
        title: i.source, category: i.category, amount: Number(i.amount),
        freq: i.frequency, date: dayjs(i.startDate || i.createdAt).format('DD-MM-YYYY'),
      })));

      addStyledSheet('Expenses', [
        { header: 'Title', key: 'title', width: 25 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount (₹)', key: 'amount', width: 16 },
        { header: 'Payment Method', key: 'payment', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
      ], data.expenses.map(e => ({
        title: e.title, category: e.category, amount: Number(e.amount),
        payment: e.paymentMethod, date: dayjs(e.expenseDate).format('DD-MM-YYYY'),
      })));
    }

    if (type === 'investment' || type === 'annual') {
      addStyledSheet('Investments', [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Buy Price (₹)', key: 'buy', width: 16 },
        { header: 'Current Price (₹)', key: 'curr', width: 18 },
        { header: 'Quantity', key: 'qty', width: 12 },
        { header: 'P&L (₹)', key: 'pnl', width: 14 },
      ], data.investments.map(i => ({
        name: i.name, type: i.investmentType,
        buy: Number(i.buyPrice), curr: Number(i.currentPrice), qty: Number(i.quantity || 1),
        pnl: (Number(i.currentPrice) - Number(i.buyPrice)) * Number(i.quantity || 1),
      })));
    }

    if (type === 'loan' || type === 'annual') {
      addStyledSheet('Loans', [
        { header: 'Lender', key: 'lender', width: 25 },
        { header: 'Type', key: 'type', width: 18 },
        { header: 'Principal (₹)', key: 'principal', width: 16 },
        { header: 'EMI (₹)', key: 'emi', width: 14 },
        { header: 'Remaining (₹)', key: 'remaining', width: 16 },
        { header: 'Interest Rate', key: 'rate', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
      ], data.loans.map(l => ({
        lender: l.lenderName, type: l.loanType,
        principal: Number(l.principalAmount), emi: Number(l.emiAmount),
        remaining: Number(l.remainingBalance), rate: `${l.interestRate}%`, status: l.status,
      })));
    }

    return workbook.xlsx.writeBuffer() as any;
  }

  // ─── CSV ───────────────────────────────────────────────────────────────────
  private async generateCsv(data: any, type: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    sheet.columns = [
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Title/Name', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount/Value (₹)', key: 'amount', width: 18 },
      { header: 'Date', key: 'date', width: 14 },
    ];

    if (type === 'monthly' || type === 'annual') {
      data.incomes.forEach(i => sheet.addRow({ type: 'Income', title: i.source, category: i.category, amount: Number(i.amount), date: dayjs(i.startDate || i.createdAt).format('DD-MM-YYYY') }));
      data.expenses.forEach(e => sheet.addRow({ type: 'Expense', title: e.title, category: e.category, amount: Number(e.amount), date: dayjs(e.expenseDate).format('DD-MM-YYYY') }));
    }

    if (type === 'investment' || type === 'annual') {
      data.investments.forEach(i => sheet.addRow({ type: 'Investment', title: i.name, category: i.investmentType, amount: Number(i.currentPrice) * Number(i.quantity || 1), date: '' }));
    }

    return workbook.csv.writeBuffer() as any;
  }

  // ─── PDF (Professional Design) ────────────────────────────────────────────
  private async generatePdf(data: any, type: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const totalIncome = data.incomes.reduce((acc, i) => acc + Number(i.amount), 0);
      const totalExpense = data.expenses.reduce((acc, e) => acc + Number(e.amount), 0);
      const netCashFlow = totalIncome - totalExpense;

      const reportDate = dayjs().format('DD MMMM YYYY');
      const userName = data.user?.fullName || 'Valued Customer';
      const fintScore = data.score?.score ?? 'N/A';
      const fintGrade = data.score?.grade ?? 'N/A';

      // ── HEADER BAR ─────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(BRAND_PRIMARY);
      doc.fillColor('white').fontSize(26).font('Helvetica-Bold').text('FINT', 50, 22);
      doc.fontSize(10).font('Helvetica').text('AI Financial Advisor', 50, 52);
      doc.fontSize(10).text(`${type.toUpperCase()} REPORT`, doc.page.width - 160, 32);
      doc.text(`Generated: ${reportDate}`, doc.page.width - 160, 47);
      doc.fillColor('black');

      // ── GREETING ───────────────────────────────────────────────────────────
      doc.moveDown(3);
      doc.fontSize(18).font('Helvetica-Bold').text(`Financial Summary for ${userName}`, 50);
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#555555').text(`Report Period: ${type === 'monthly' ? dayjs().format('MMMM YYYY') : 'All Time'}  |  FINT Score: ${fintScore} (${fintGrade})`);
      doc.fillColor('black');
      doc.moveDown(1);

      // ── SUMMARY CARDS ──────────────────────────────────────────────────────
      const cardY = doc.y;
      const cardW = 145;
      const gap = 15;

      const drawCard = (x: number, label: string, value: string, color: string) => {
        doc.rect(x, cardY, cardW, 60).fill('#F8F9FA');
        doc.rect(x, cardY, 4, 60).fill(color);
        doc.fillColor('#888888').fontSize(9).font('Helvetica').text(label, x + 12, cardY + 10, { width: cardW - 14 });
        doc.fillColor('#1A1A2E').fontSize(14).font('Helvetica-Bold').text(value, x + 12, cardY + 26, { width: cardW - 14 });
        doc.fillColor('black');
      };

      drawCard(50, 'TOTAL INCOME', `₹${totalIncome.toLocaleString('en-IN')}`, BRAND_GREEN);
      drawCard(50 + cardW + gap, 'TOTAL EXPENSES', `₹${totalExpense.toLocaleString('en-IN')}`, BRAND_RED);
      drawCard(50 + 2 * (cardW + gap), 'NET CASH FLOW', `₹${netCashFlow.toLocaleString('en-IN')}`, netCashFlow >= 0 ? BRAND_GREEN : BRAND_RED);

      doc.y = cardY + 70;
      doc.moveDown(1);

      // ─── SECTION: INCOMES ──────────────────────────────────────────────────
      this.pdfSectionHeader(doc, '📥 Income Breakdown');
      if (data.incomes.length === 0) {
        doc.fontSize(10).fillColor('#888888').text('No income records found.').fillColor('black');
      } else {
        this.pdfTable(doc, ['Source', 'Category', 'Frequency', 'Amount (₹)'], data.incomes.slice(0, 15).map(i => [
          i.source,
          i.category,
          i.frequency,
          `₹${Number(i.amount).toLocaleString('en-IN')}`,
        ]));
      }

      // ─── SECTION: EXPENSES ─────────────────────────────────────────────────
      doc.moveDown(1);
      this.pdfSectionHeader(doc, '📤 Expense Breakdown');
      if (data.expenses.length === 0) {
        doc.fontSize(10).fillColor('#888888').text('No expense records found.').fillColor('black');
      } else {
        this.pdfTable(doc, ['Title', 'Category', 'Payment Method', 'Amount (₹)'], data.expenses.slice(0, 15).map(e => [
          e.title,
          e.category,
          e.paymentMethod,
          `₹${Number(e.amount).toLocaleString('en-IN')}`,
        ]));
      }

      // ─── SECTION: LOANS ────────────────────────────────────────────────────
      if (data.loans.length > 0) {
        doc.moveDown(1);
        this.pdfSectionHeader(doc, '🏦 Active Loans');
        this.pdfTable(doc, ['Lender', 'Type', 'EMI (₹)', 'Remaining (₹)', 'Status'], data.loans.map(l => [
          l.lenderName,
          l.loanType,
          `₹${Number(l.emiAmount).toLocaleString('en-IN')}`,
          `₹${Number(l.remainingBalance).toLocaleString('en-IN')}`,
          l.status,
        ]));
      }

      // ─── SECTION: INVESTMENTS ──────────────────────────────────────────────
      if (data.investments.length > 0) {
        doc.moveDown(1);
        this.pdfSectionHeader(doc, '📈 Investment Portfolio');
        this.pdfTable(doc, ['Name', 'Type', 'Buy Price', 'Current Price', 'P&L (₹)'], data.investments.map(i => {
          const pnl = (Number(i.currentPrice) - Number(i.buyPrice)) * Number(i.quantity || 1);
          return [
            i.name,
            i.investmentType,
            `₹${Number(i.buyPrice).toLocaleString('en-IN')}`,
            `₹${Number(i.currentPrice).toLocaleString('en-IN')}`,
            `${pnl >= 0 ? '+' : ''}₹${pnl.toLocaleString('en-IN')}`,
          ];
        }));
      }

      // ─── SECTION: GOALS ────────────────────────────────────────────────────
      if (data.goals.length > 0) {
        doc.moveDown(1);
        this.pdfSectionHeader(doc, '🎯 Financial Goals');
        this.pdfTable(doc, ['Goal', 'Type', 'Target (₹)', 'Saved (₹)', 'Progress'], data.goals.map(g => {
          const progress = Math.min(100, Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100));
          return [
            g.title,
            g.goalType,
            `₹${Number(g.targetAmount).toLocaleString('en-IN')}`,
            `₹${Number(g.currentAmount).toLocaleString('en-IN')}`,
            `${progress}%`,
          ];
        }));
      }

      // ── FOOTER ─────────────────────────────────────────────────────────────
      doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(BRAND_PRIMARY);
      doc.fillColor('white').fontSize(8).font('Helvetica')
        .text('This report is generated by FINT AI Financial Advisor. For informational purposes only.', 50, doc.page.height - 26, { align: 'center' });

      doc.end();
    });
  }

  // ─── PDF Helpers ──────────────────────────────────────────────────────────
  private pdfSectionHeader(doc: InstanceType<typeof PDFDocument>, title: string) {
    doc.rect(50, doc.y, doc.page.width - 100, 28).fill('#1A1A2E');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text(title, 60, doc.y - 22);
    doc.fillColor('black');
    doc.moveDown(0.5);
  }

  private pdfTable(doc: InstanceType<typeof PDFDocument>, headers: string[], rows: string[][]) {
    const colCount = headers.length;
    const tableWidth = doc.page.width - 100;
    const colWidth = tableWidth / colCount;
    const rowHeight = 20;
    let startX = 50;
    let startY = doc.y;

    // Header row
    doc.rect(startX, startY, tableWidth, rowHeight).fill('#E8E8E8');
    headers.forEach((h, i) => {
      doc.fillColor('#1A1A2E').fontSize(9).font('Helvetica-Bold')
        .text(h, startX + i * colWidth + 4, startY + 6, { width: colWidth - 8, lineBreak: false });
    });
    startY += rowHeight;

    // Data rows
    rows.forEach((row, ri) => {
      if (startY > doc.page.height - 80) {
        doc.addPage();
        startY = 50;
      }
      if (ri % 2 === 0) {
        doc.rect(startX, startY, tableWidth, rowHeight).fill('#FAFAFA');
      }
      row.forEach((cell, ci) => {
        doc.fillColor('#333333').fontSize(8).font('Helvetica')
          .text(String(cell), startX + ci * colWidth + 4, startY + 6, { width: colWidth - 8, lineBreak: false });
      });
      // bottom border
      doc.rect(startX, startY + rowHeight - 1, tableWidth, 1).fill('#E0E0E0');
      startY += rowHeight;
    });

    doc.fillColor('black');
    doc.y = startY + 4;
  }
}
