import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface SalePdf {
  title: string;
  store: string;
  address: string;
  phone: string;
  customer: string;
  reference: string;
  trailer: string;
  vin: string;
  lines: { label: string; cents: number }[];
  totalCents: number;
}
export async function salePdf(data: SalePdf): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const page = document.addPage([612, 792]);
  const ink = rgb(0.08, 0.18, 0.18);
  const teal = rgb(0.02, 0.33, 0.3);
  page.drawRectangle({ x: 0, y: 688, width: 612, height: 104, color: teal });
  page.drawText(data.store, {
    x: 44,
    y: 746,
    size: 21,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(data.title, {
    x: 44,
    y: 714,
    size: 14,
    font: regular,
    color: rgb(1, 1, 1),
  });
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value / 100);
  const text = (value: string, y: number, strong = false) => {
    page.drawText(value, {
      x: 44,
      y,
      size: 11,
      font: strong ? bold : regular,
      color: ink,
      maxWidth: 524,
      lineHeight: 15,
    });
  };
  text(data.address, 658);
  text(data.phone, 640);
  text(`Prepared for: ${data.customer}`, 604, true);
  text(`Reference: ${data.reference}`, 584);
  text(data.trailer, 550, true);
  text(`VIN: ${data.vin}`, 530);
  let y = 486;
  for (const line of data.lines) {
    text(line.label, y);
    const amount = money(line.cents);
    page.drawText(amount, {
      x: 568 - regular.widthOfTextAtSize(amount, 11),
      y,
      size: 11,
      font: regular,
      color: ink,
    });
    y -= 22;
  }
  page.drawLine({
    start: { x: 44, y: y + 7 },
    end: { x: 568, y: y + 7 },
    thickness: 1,
    color: teal,
  });
  text("Total", y - 18, true);
  page.drawText(money(data.totalCents), {
    x: 440,
    y: y - 18,
    size: 15,
    font: bold,
    color: teal,
  });
  text("Thank you for choosing our dealership.", 64);
  text("TrailerDesk", 46);
  return document.save();
}
