import {
    PDFDocument,
    StandardFonts,
    rgb,
} from "pdf-lib";

/* =========================================================
   TIPOS
========================================================= */

type DocumentType =
    | "Presupuesto"
    | "Recibo"
    | "Factura"
    | "Comprobante";

interface DocumentoPDFProps {
    tipo: DocumentType;
    numero: string;
    fecha: string;
    cliente: {
        nombre: string;
        email?: string;
    };
    vehiculo: {
        marca: string;
        modelo: string;
        patente: string;
    };
    items: {
        type: "Servicio" | "Repuesto";
        name: string;
        quantity: number;
        price: number;
    }[];
    laborCost: number;
    partsCost: number;
    total: number;
    observaciones?: string;
    adelanto?: {
        importe: number;
        medioPago: string;
        fecha: string;
    };
    saldoPendiente?: number;
    partsPdf?: File | null;
    formatCurrency: (value: number) => string;
    formatDate: (value: string) => string;
}

/* =========================================================
   CONSTANTES PDF
========================================================= */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const MARGIN_Y = 55;

const BLACK = rgb(0.05, 0.05, 0.05);
const DARK_GRAY = rgb(0.25, 0.25, 0.25);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.92, 0.92, 0.92);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.16, 0.7, 0.38);
const RED = rgb(0.85, 0.2, 0.2);
const BLUE = rgb(0.2, 0.4, 0.85);

/* =========================================================
   FUNCIÓN PRINCIPAL
========================================================= */

const DocumentoPDF = async ({
    tipo,
    numero,
    fecha,
    cliente,
    vehiculo,
    items,
    laborCost,
    partsCost,
    total,
    observaciones,
    adelanto,
    saldoPendiente,
    partsPdf,
    formatCurrency,
    formatDate,
}: DocumentoPDFProps) => {
    const pdf = await PDFDocument.create();

    const regularFont = await pdf.embedFont(
        StandardFonts.Helvetica
    );

    const boldFont = await pdf.embedFont(
        StandardFonts.HelveticaBold
    );

    /* =====================================================
       1. AGREGAR PDF DE REPUESTOS SI EXISTE
    ===================================================== */

    if (partsPdf) {
        const partsPdfBytes =
            await partsPdf.arrayBuffer();

        const supplierPdf = await PDFDocument.load(
            partsPdfBytes
        );

        const supplierPages = await pdf.copyPages(
            supplierPdf,
            supplierPdf.getPageIndices()
        );

        supplierPages.forEach((page) => {
            pdf.addPage(page);
        });
    }

    /* =====================================================
       2. CREAR PÁGINA PRINCIPAL
    ===================================================== */

    let currentPage = pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
    ]);

    let y = PAGE_HEIGHT - MARGIN_Y;

    /* =====================================================
       HELPERS
    ===================================================== */

    const drawText = (
        text: string,
        x: number,
        yPos: number,
        size = 10,
        font = regularFont,
        color = BLACK
    ) => {
        currentPage.drawText(text, {
            x,
            y: yPos,
            size,
            font,
            color,
        });
    };

    const drawLine = (
        yPos: number,
        x1 = MARGIN_X,
        x2 = PAGE_WIDTH - MARGIN_X,
        thickness = 0.7,
        color = LIGHT_GRAY
    ) => {
        currentPage.drawLine({
            start: { x: x1, y: yPos },
            end: { x: x2, y: yPos },
            thickness,
            color,
        });
    };

    const createNewPage = () => {
        currentPage = pdf.addPage([
            PAGE_WIDTH,
            PAGE_HEIGHT,
        ]);
        y = PAGE_HEIGHT - MARGIN_Y;
        drawHeader();
    };

    const drawHeader = () => {
        // Título
        drawText(
            "MORA MECÁNICA",
            MARGIN_X,
            y,
            16,
            boldFont,
            BLACK
        );

        // Tipo de documento
        const tipoColor =
            tipo === "Presupuesto"
                ? BLUE
                : tipo === "Recibo"
                  ? GREEN
                  : DARK_GRAY;

        drawText(
            tipo.toUpperCase(),
            PAGE_WIDTH - 150,
            y,
            11,
            boldFont,
            tipoColor
        );

        y -= 18;

        // Número y fecha
        drawText(
            `Nro: ${numero}`,
            MARGIN_X,
            y,
            9,
            boldFont
        );

        drawText(
            `Fecha: ${formatDate(fecha)}`,
            300,
            y,
            9,
            regularFont,
            DARK_GRAY
        );

        y -= 20;

        drawLine(y);

        y -= 18;
    };

    /* =====================================================
       HEADER
    ===================================================== */

    drawHeader();

    /* =====================================================
       CLIENTE Y VEHÍCULO
    ===================================================== */

    drawText(
        "CLIENTE",
        MARGIN_X,
        y,
        8,
        boldFont,
        GRAY
    );

    y -= 14;

    drawText(
        cliente.nombre,
        MARGIN_X,
        y,
        10,
        boldFont
    );

    if (cliente.email) {
        y -= 12;
        drawText(
            cliente.email,
            MARGIN_X,
            y,
            8,
            regularFont,
            DARK_GRAY
        );
    }

    // Vehículo a la derecha
    drawText(
        "VEHÍCULO",
        330,
        y + 14,
        8,
        boldFont,
        GRAY
    );

    drawText(
        `${vehiculo.marca} ${vehiculo.modelo}`,
        330,
        y,
        10,
        boldFont
    );

    if (vehiculo.patente) {
        y -= 12;
        drawText(
            `Patente: ${vehiculo.patente}`,
            330,
            y,
            8,
            regularFont,
            DARK_GRAY
        );
    }

    y -= 28;

    /* =====================================================
       TABLA DE ITEMS
    ===================================================== */

    const TABLE_LEFT = MARGIN_X;
    const TABLE_RIGHT = PAGE_WIDTH - MARGIN_X;
    const TABLE_WIDTH = TABLE_RIGHT - TABLE_LEFT;

    // Header
    const headerHeight = 20;
    currentPage.drawRectangle({
        x: TABLE_LEFT,
        y: y - headerHeight,
        width: TABLE_WIDTH,
        height: headerHeight,
        color: BLACK,
    });

    drawText(
        "CONCEPTO",
        TABLE_LEFT + 8,
        y - 14,
        7,
        boldFont,
        WHITE
    );

    drawText(
        "TIPO",
        315,
        y - 14,
        7,
        boldFont,
        WHITE
    );

    drawText(
        "CANT.",
        375,
        y - 14,
        7,
        boldFont,
        WHITE
    );

    drawText(
        "PRECIO",
        420,
        y - 14,
        7,
        boldFont,
        WHITE
    );

    drawText(
        "IMPORTE",
        490,
        y - 14,
        7,
        boldFont,
        WHITE
    );

    y -= 28;

    // Validar items
    const validItems = items.filter(
        (item) => item.name.trim() !== ""
    );

    if (validItems.length === 0) {
        drawText(
            "Sin conceptos detallados.",
            TABLE_LEFT + 8,
            y,
            8.5,
            regularFont,
            GRAY
        );
        y -= 24;
    } else {
        validItems.forEach((item) => {
            if (y < 120) {
                createNewPage();
                y -= 24;
            }

            const subtotal =
                item.quantity * item.price;

            let conceptName =
                item.name.trim();

            if (conceptName.length > 45) {
                conceptName =
                    conceptName.slice(
                        0,
                        42
                    ) + "...";
            }

            drawText(
                conceptName,
                TABLE_LEFT + 8,
                y,
                8,
                regularFont
            );

            drawText(
                item.type,
                315,
                y,
                8,
                regularFont,
                DARK_GRAY
            );

            drawText(
                String(item.quantity),
                380,
                y,
                8,
                regularFont,
                DARK_GRAY
            );

            drawText(
                formatCurrency(
                    item.price
                ),
                420,
                y,
                8,
                regularFont,
                DARK_GRAY
            );

            drawText(
                formatCurrency(
                    subtotal
                ),
                490,
                y,
                8,
                boldFont
            );

            drawLine(y - 9);

            y -= 24;
        });
    }

    /* =====================================================
       RESUMEN ECONÓMICO
    ===================================================== */

    if (y < 160) {
        createNewPage();
    }

    y -= 12;

    drawText(
        "RESUMEN DE COSTOS",
        MARGIN_X,
        y,
        9,
        boldFont
    );

    y -= 24;

    // Mano de obra
    drawText(
        "Mano de obra",
        350,
        y,
        9,
        regularFont,
        DARK_GRAY
    );

    drawText(
        formatCurrency(laborCost),
        485,
        y,
        9,
        regularFont
    );

    y -= 18;

    // Repuestos
    drawText(
        "Repuestos",
        350,
        y,
        9,
        regularFont,
        DARK_GRAY
    );

    drawText(
        formatCurrency(partsCost),
        485,
        y,
        9,
        regularFont
    );

    y -= 12;

    drawLine(y, 345, PAGE_WIDTH - MARGIN_X);

    y -= 20;

    // Total
    drawText(
        "TOTAL",
        345,
        y,
        10,
        boldFont
    );

    drawText(
        formatCurrency(total),
        475,
        y,
        12,
        boldFont,
        tipo === "Recibo" ? GREEN : BLACK
    );

    /* =====================================================
       ADELANTO Y SALDO
    ===================================================== */

    if (adelanto && adelanto.importe > 0) {
        y -= 28;

        drawText(
            "ADELANTO RECIBIDO",
            345,
            y,
            9,
            regularFont,
            DARK_GRAY
        );

        drawText(
            formatCurrency(
                adelanto.importe
            ),
            485,
            y,
            9,
            boldFont,
            GREEN
        );

        y -= 16;

        drawText(
            `${adelanto.medioPago} - ${formatDate(
                adelanto.fecha
            )}`,
            345,
            y,
            7.5,
            regularFont,
            GRAY
        );

        y -= 16;

        drawLine(y, 345, PAGE_WIDTH - MARGIN_X);

        y -= 18;

        drawText(
            "SALDO PENDIENTE",
            345,
            y,
            10,
            boldFont,
            RED
        );

        const balance =
            saldoPendiente !== undefined
                ? saldoPendiente
                : total - adelanto.importe;

        drawText(
            formatCurrency(
                Math.max(balance, 0)
            ),
            475,
            y,
            12,
            boldFont,
            RED
        );
    }

    /* =====================================================
       OBSERVACIONES
    ===================================================== */

    if (observaciones?.trim()) {
        y -= 32;

        drawText(
            "OBSERVACIONES",
            MARGIN_X,
            y,
            9,
            boldFont
        );

        y -= 16;

        const noteLines =
            observaciones
                .trim()
                .split("\n");

        noteLines.forEach((line) => {
            const words = line.split(" ");
            let currentLine = "";
            const maxChars = 95;

            words.forEach((word) => {
                const testLine = currentLine
                    ? `${currentLine} ${word}`
                    : word;

                if (
                    testLine.length >
                    maxChars
                ) {
                    drawText(
                        currentLine,
                        MARGIN_X,
                        y,
                        8.5,
                        regularFont,
                        DARK_GRAY
                    );

                    y -= 12;

                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine) {
                drawText(
                    currentLine,
                    MARGIN_X,
                    y,
                    8.5,
                    regularFont,
                    DARK_GRAY
                );

                y -= 12;
            }
        });
    }

    /* =====================================================
       FOOTER
    ===================================================== */

    currentPage.drawLine({
        start: {
            x: MARGIN_X,
            y: 45,
        },

        end: {
            x: PAGE_WIDTH - MARGIN_X,
            y: 45,
        },

        thickness: 0.7,

        color: LIGHT_GRAY,
    });

    drawText(
        "MORA MECÁNICA - Servicio y Mantenimiento Automotor",
        MARGIN_X,
        28,
        7,
        boldFont,
        DARK_GRAY
    );

    drawText(
        `${tipo} válido según condiciones establecidas`,
        MARGIN_X,
        18,
        6.5,
        regularFont,
        GRAY
    );

    /* =====================================================
       RETORNAR
    ===================================================== */

    return await pdf.save();
};

export default DocumentoPDF;
