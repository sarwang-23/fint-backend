import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

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
    
    // Depending on type (monthly, annual, investment, loan, tax), we fetch different data.
    // For simplicity, we just fetch a comprehensive view for the current month for 'monthly', all for others.
    
    const incomes = await this.prisma.income.findMany({ where: { userId, deletedAt: null } });
    const expenses = await this.prisma.expense.findMany({ where: { userId, deletedAt: null } });
    const loans = await this.prisma.loan.findMany({ where: { userId, deletedAt: null } });
    const investments = await this.prisma.investment.findMany({ where: { userId, deletedAt: null } });
    const goals = await this.prisma.financialGoal.findMany({ where: { userId, deletedAt: null } });

    let filteredIncomes = incomes;
    let filteredExpenses = expenses;

    if (type === 'monthly') {
      filteredIncomes = incomes.filter(i => dayjs(i.startDate || i.createdAt).isAfter(startOfMonth) && dayjs(i.startDate || i.createdAt).isBefore(endOfMonth));
      filteredExpenses = expenses.filter(e => dayjs(e.expenseDate).isAfter(startOfMonth) && dayjs(e.expenseDate).isBefore(endOfMonth));
    }

    return { incomes: filteredIncomes, expenses: filteredExpenses, loans, investments, goals };
  }

  private async generateExcel(data: any, type: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    if (type === 'monthly' || type === 'annual') {
      const incSheet = workbook.addWorksheet('Incomes');
      incSheet.columns = [
        { header: 'Title', key: 'title', width: 20 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
      ];
      data.incomes.forEach(i => incSheet.addRow({ title: i.source, category: i.category, amount: i.amount, date: dayjs(i.startDate || i.createdAt).format('YYYY-MM-DD') }));

      const expSheet = workbook.addWorksheet('Expenses');
      expSheet.columns = [
        { header: 'Title', key: 'title', width: 20 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
      ];
      data.expenses.forEach(e => expSheet.addRow({ title: e.title, category: e.category, amount: e.amount, date: dayjs(e.expenseDate).format('YYYY-MM-DD') }));
    }

    if (type === 'investment' || type === 'annual') {
      const invSheet = workbook.addWorksheet('Investments');
      invSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Buy Price', key: 'buy', width: 15 },
        { header: 'Current Price', key: 'curr', width: 15 },
        { header: 'Quantity', key: 'qty', width: 10 },
      ];
      data.investments.forEach(i => invSheet.addRow({ name: i.name, type: i.investmentType, buy: i.buyPrice, curr: i.currentPrice, qty: i.quantity }));
    }

    return workbook.xlsx.writeBuffer() as any;
  }

  private async generateCsv(data: any, type: string): Promise<Buffer> {
    // Basic CSV implementation using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');
    
    // Flatten data for CSV
    sheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Title/Name', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount/Value', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
    ];

    if (type === 'monthly' || type === 'annual') {
      data.incomes.forEach(i => sheet.addRow({ type: 'Income', title: i.source, category: i.category, amount: i.amount, date: dayjs(i.startDate || i.createdAt).format('YYYY-MM-DD') }));
      data.expenses.forEach(e => sheet.addRow({ type: 'Expense', title: e.title, category: e.category, amount: e.amount, date: dayjs(e.expenseDate).format('YYYY-MM-DD') }));
    }
    
    if (type === 'investment' || type === 'annual') {
      data.investments.forEach(i => sheet.addRow({ type: 'Investment', title: i.name, category: i.investmentType, amount: Number(i.currentPrice) * Number(i.quantity || 1), date: '' }));
    }

    return workbook.csv.writeBuffer() as any;
  }

  private async generatePdf(data: any, type: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(`FINT Financial Report - ${type.toUpperCase()}`, { align: 'center' });
      doc.moveDown();

      const totalIncome = data.incomes.reduce((acc, i) => acc + Number(i.amount), 0);
      const totalExpense = data.expenses.reduce((acc, e) => acc + Number(e.amount), 0);

      doc.fontSize(14).text(`Total Income: ₹${totalIncome}`);
      doc.text(`Total Expense: ₹${totalExpense}`);
      doc.text(`Net Cash Flow: ₹${totalIncome - totalExpense}`);
      
      doc.moveDown();
      doc.fontSize(16).text('Incomes:', { underline: true });
      data.incomes.slice(0, 10).forEach(i => {
        doc.fontSize(12).text(`${i.source} (${i.category}): ₹${i.amount} - ${dayjs(i.startDate || i.createdAt).format('YYYY-MM-DD')}`);
      });
      if (data.incomes.length > 10) doc.text('...and more');

      doc.moveDown();
      doc.fontSize(16).text('Expenses:', { underline: true });
      data.expenses.slice(0, 10).forEach(e => {
        doc.fontSize(12).text(`${e.title} (${e.category}): ₹${e.amount} - ${dayjs(e.expenseDate).format('YYYY-MM-DD')}`);
      });
      if (data.expenses.length > 10) doc.text('...and more');

      doc.end();
    });
  }
}
