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
    logoUrl?: string;
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
    logoUrl,
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

    let logoImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;

    const logoToUse = logoUrl || "/logopdf.png";

    try {
        const response = await fetch(logoToUse);
        const logoBytes = await response.arrayBuffer();

        const imageUrl = logoToUse.toLowerCase();

        if (imageUrl.endsWith(".png")) {
            logoImage = await pdf.embedPng(logoBytes);
        } else if (
            imageUrl.endsWith(".jpg") ||
            imageUrl.endsWith(".jpeg")
        ) {
            logoImage = await pdf.embedJpg(logoBytes);
        }
    } catch (error) {
        console.error("No se pudo cargar el logo:", error);
    }

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
        color = BLACK
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
    const HEADER_TOP = PAGE_HEIGHT - 30;

    // =====================================================
    // LOGO
    // =====================================================

    if (logoImage) {
        const logoWidth = 110;
        const logoHeight =
            (logoImage.height / logoImage.width) *
            logoWidth;

        currentPage.drawImage(logoImage, {
            x: MARGIN_X,
            y: HEADER_TOP - logoHeight - 5,
            width: logoWidth,
            height: logoHeight,
        });
    } else {
        drawText(
            "MORA MECÁNICA",
            MARGIN_X,
            HEADER_TOP,
            16,
            boldFont,
            BLACK
        );
    }

    // =====================================================
    // TIPO DE DOCUMENTO (derecha)
    // =====================================================

    const tipoColor =
        tipo === "Presupuesto"
            ? BLUE
            : tipo === "Recibo"
              ? GREEN
              : DARK_GRAY;

    const tipoText = tipo.toUpperCase();

    drawText(
        tipoText,
        PAGE_WIDTH - MARGIN_X - 100,
        HEADER_TOP,
        12,
        boldFont,
        tipoColor
    );

    // =====================================================
    // NÚMERO Y FECHA (segunda línea)
    // =====================================================

    const infoY = HEADER_TOP - 104;

    drawText(
        `Nro: ${numero}`,
        MARGIN_X,
        infoY,
        9,
        boldFont,
        DARK_GRAY
    );

    drawText(
        `Fecha: ${formatDate(fecha)}`,
        PAGE_WIDTH - MARGIN_X - 130,
        infoY,
        9,
        regularFont,
        DARK_GRAY
    );

    // =====================================================
    // LÍNEA SEPARADORA
    // =====================================================

    const separatorY = infoY - 8;

    drawLine(
        separatorY,
        MARGIN_X,
        PAGE_WIDTH - MARGIN_X,
        1,
        BLACK
    );

    // =====================================================
    // ESPACIO PARA EL CONTENIDO
    // =====================================================

    y = separatorY - 28;
};

    /* =====================================================
       HEADER
    ===================================================== */

    drawHeader();

    /* =====================================================
       CLIENTE Y VEHÍCULO
    ===================================================== */

    y -= 8;

    drawText(
        "CLIENTE",
        MARGIN_X,
        y,
        8,
        boldFont,
        GRAY
    );

    y -= 16;

    drawText(
        cliente.nombre,
        MARGIN_X,
        y,
        11,
        boldFont
    );

    if (cliente.email) {
        y -= 14;
        drawText(
            cliente.email,
            MARGIN_X,
            y,
            8,
            regularFont,
            DARK_GRAY
        );
    }

    // Vehículo a la derecha (pone referencias en el mismo nivel de CLIENTE)
    const clienteLabelY = y + (cliente.email ? 30 : 16);
    
    drawText(
        "VEHÍCULO",
        330,
        clienteLabelY,
        8,
        boldFont,
        GRAY
    );

    drawText(
        `${vehiculo.marca} ${vehiculo.modelo}`,
        330,
        clienteLabelY - 16,
        11,
        boldFont
    );

    if (vehiculo.patente) {
        drawText(
            `Patente: ${vehiculo.patente}`,
            330,
            clienteLabelY - 30,
            8,
            regularFont,
            DARK_GRAY
        );
    }

    y -= 36;

    /* =====================================================
       TABLA DE ITEMS
    ===================================================== */

    y -= 8;

    const TABLE_LEFT = MARGIN_X;
    const TABLE_RIGHT = PAGE_WIDTH - MARGIN_X;
    const TABLE_WIDTH = TABLE_RIGHT - TABLE_LEFT;

    // Header
    const headerHeight = 22;
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
        y - 15,
        8,
        boldFont,
        WHITE
    );

    drawText(
        "TIPO",
        315,
        y - 15,
        8,
        boldFont,
        WHITE
    );

    drawText(
        "CANT.",
        375,
        y - 15,
        8,
        boldFont,
        WHITE
    );

    drawText(
        "PRECIO",
        420,
        y - 15,
        8,
        boldFont,
        WHITE
    );

    drawText(
        "IMPORTE",
        490,
        y - 15,
        8,
        boldFont,
        WHITE
    );

    y -= 30;

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

    y -= 16;

    drawText(
        "RESUMEN DE COSTOS",
        MARGIN_X,
        y,
        10,
        boldFont,
        DARK_GRAY
    );

    y -= 26;

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
        boldFont
    );

    y -= 20;

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
        boldFont
    );

    y -= 14;

    drawLine(y, 345, PAGE_WIDTH - MARGIN_X);

    y -= 22;

    // Total
    drawText(
        "TOTAL",
        345,
        y,
        11,
        boldFont,
        tipo === "Recibo" ? GREEN : BLACK
    );

    drawText(
        formatCurrency(total),
        475,
        y,
        13,
        boldFont,
        tipo === "Recibo" ? GREEN : BLACK
    );

    /* =====================================================
       ADELANTO Y SALDO
    ===================================================== */

    if (adelanto && adelanto.importe > 0) {
        y -= 30;

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
            10,
            boldFont,
            GREEN
        );

        y -= 18;

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

        y -= 18;

        drawLine(y, 345, PAGE_WIDTH - MARGIN_X);

        y -= 22;

        drawText(
            "SALDO PENDIENTE",
            345,
            y,
            11,
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
            13,
            boldFont,
            RED
        );
    }

    /* =====================================================
       OBSERVACIONES
    ===================================================== */

    if (observaciones?.trim()) {
        y -= 36;

        drawText(
            "OBSERVACIONES",
            MARGIN_X,
            y,
            9,
            boldFont,
            DARK_GRAY
        );

        y -= 18;

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
                        8,
                        regularFont,
                        DARK_GRAY
                    );

                    y -= 14;

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
                    8,
                    regularFont,
                    DARK_GRAY
                );

                y -= 14;
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
