
import {
    PDFDocument,
    StandardFonts,
    rgb,
} from "pdf-lib";


/* =========================================================
   TIPOS
========================================================= */

interface PdfProps {

    numero: string;

    logoUrl?: string;

    selectedClient?: {
        nombre: string;
        email: string;
    };

    selectedVehicle?: {
        marca: string;
        modelo: string;
        patente: string;
    };

    budgetItems: {
        type: "Servicio" | "Repuesto";
        name: string;
        quantity: number;
        price: number;
    }[];

    laborCost: number;

    partsCost: number;

    budgetTotal: number;

    notes: string;

    partsPdf: File | null;

    formatCurrency: (
        value: number
    ) => string;

    formatDate: (
        value: string
    ) => string;

    advancePayment?: {
        importe: number;
        medioPago: string;
        fecha: string;
    } | null;

    remainingBalance?: number;
}


/* =========================================================
   CONSTANTES PDF
========================================================= */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 42;

const BLACK = rgb(
    0.05,
    0.05,
    0.05
);

const DARK_GRAY = rgb(
    0.25,
    0.25,
    0.25
);

const GRAY = rgb(
    0.45,
    0.45,
    0.45
);

const LIGHT_GRAY = rgb(
    0.92,
    0.92,
    0.92
);

const WHITE = rgb(
    1,
    1,
    1
);


/* =========================================================
   FUNCIÓN PRINCIPAL
========================================================= */

const Pdf = async ({
    numero,
    selectedClient,
    selectedVehicle,
    budgetItems,
    laborCost,
    partsCost,
    budgetTotal,
    notes,
    partsPdf,
    logoUrl,
    formatCurrency,
    formatDate,
    advancePayment,
    remainingBalance,
}: PdfProps) => {

    /* =====================================================
       CREAR PDF FINAL
    ===================================================== */

    const pdf =
        await PDFDocument.create();

        let logoImage = null;

        const logoToUse = logoUrl || "/logonbg.jpeg";

        try {
            const response =
                await fetch(logoToUse);

            const logoBytes =
                await response.arrayBuffer();

            const imageUrl = logoToUse.toLowerCase();

            if (imageUrl.endsWith(".png")) {
                logoImage =
                    await pdf.embedPng(
                        logoBytes
                    );
            } else if (
                imageUrl.endsWith(".jpg") ||
                imageUrl.endsWith(".jpeg")
            ) {
                logoImage =
                    await pdf.embedJpg(
                        logoBytes
                    );
            }
        } catch (error) {
            console.error(
                "No se pudo cargar el logo:",
                error
            );
        }


    /* =====================================================
       FUENTES
    ===================================================== */

    const regularFont =
        await pdf.embedFont(
            StandardFonts.Helvetica
        );

    const boldFont =
        await pdf.embedFont(
            StandardFonts.HelveticaBold
        );


    /* =====================================================
       1. PDF DE REPUESTOS
       
       SE AGREGA PRIMERO
    ===================================================== */

    if (partsPdf) {

        const partsPdfBytes =
            await partsPdf.arrayBuffer();

        const supplierPdf =
            await PDFDocument.load(
                partsPdfBytes
            );

        const supplierPages =
            await pdf.copyPages(
                supplierPdf,
                supplierPdf.getPageIndices()
            );

        supplierPages.forEach(
            (supplierPage) => {

                pdf.addPage(
                    supplierPage
                );

            }
        );

    }


    /* =====================================================
       2. PÁGINA DE MORA MECÁNICA
    ===================================================== */

    let currentPage =
        pdf.addPage([
            PAGE_WIDTH,
            PAGE_HEIGHT,
        ]);


    let y =
        PAGE_HEIGHT - 55;


    /* =====================================================
       HELPERS
    ===================================================== */

    const drawText = (
        text: string,
        x: number,
        yPosition: number,
        size = 10,
        font = regularFont,
        color = BLACK
    ) => {

        currentPage.drawText(
            text,
            {
                x,
                y: yPosition,
                size,
                font,
                color,
            }
        );

    };


    const drawLine = (
        yPosition: number,
        x1 = MARGIN_X,
        x2 = PAGE_WIDTH - MARGIN_X,
        thickness = 0.7,
        color = BLACK
    ) => {

        currentPage.drawLine({
            start: {
                x: x1,
                y: yPosition,
            },

            end: {
                x: x2,
                y: yPosition,
            },

            thickness,

            color,
        });

    };


const drawPageHeader = () => {
    if (logoImage) {
        const logoWidth = 110;
        const logoHeight =
            (logoImage.height /
                logoImage.width) *
            logoWidth;

        currentPage.drawImage(
            logoImage,
            {
                x: MARGIN_X,
                y:
                    PAGE_HEIGHT -
                    logoHeight -
                    10,
                width: logoWidth,
                height: logoHeight,
            }
        );
    } else {
        drawText(
            "MORA MECÁNICA",
            MARGIN_X,
            PAGE_HEIGHT - 30,
            18,
            boldFont,
            BLACK
        );
    }

    drawText(
        "PRESUPUESTO",
        PAGE_WIDTH - MARGIN_X - 100,
        PAGE_HEIGHT - 30,
        13,
        boldFont,
        rgb(0.2, 0.4, 0.85)
    );

    drawLine(
        PAGE_HEIGHT - 60,
        MARGIN_X,
        PAGE_WIDTH - MARGIN_X,
        1,
        BLACK
    );
};


    /* =====================================================
       TABLA
    ===================================================== */

    const TABLE_LEFT = MARGIN_X;

    const TABLE_RIGHT =
        PAGE_WIDTH - MARGIN_X;

    const TABLE_WIDTH =
        TABLE_RIGHT - TABLE_LEFT;


    const drawTableHeader = () => {

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
            TABLE_LEFT + 10,
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

    };


    const createNewPage = () => {

        currentPage =
            pdf.addPage([
                PAGE_WIDTH,
                PAGE_HEIGHT,
            ]);

        y =
            PAGE_HEIGHT - 70;

        drawPageHeader();

    };


    /* =====================================================
       HEADER
    ===================================================== */

    drawPageHeader();


    /* =====================================================
       DATOS DEL PRESUPUESTO
    ===================================================== */

    y = PAGE_HEIGHT - 75;

    drawText(
        `Nro: ${numero}`,
        MARGIN_X,
        y,
        9,
        boldFont,
        DARK_GRAY
    );

    drawText(
        `Fecha: ${formatDate(
            new Date()
                .toISOString()
                .split("T")[0]
        )}`,
        PAGE_WIDTH - MARGIN_X - 130,
        y,
        9,
        regularFont,
        DARK_GRAY
    );

    y -= 32;


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

    y -= 16;

    drawText(
        selectedClient?.nombre ||
            "Sin cliente",
        MARGIN_X,
        y,
        11,
        boldFont
    );

    if (
        selectedClient?.email
    ) {

        drawText(
            selectedClient.email,
            MARGIN_X,
            y - 14,
            8,
            regularFont,
            DARK_GRAY
        );

    }

    // Vehículo en la derecha
    const clienteLabelY = y + (selectedClient?.email ? 30 : 16);
    
    drawText(
        "VEHÍCULO",
        315,
        clienteLabelY,
        8,
        boldFont,
        GRAY
    );

    drawText(
        selectedVehicle
            ? `${selectedVehicle.marca} ${selectedVehicle.modelo}`
            : "Sin vehículo",
        315,
        clienteLabelY - 16,
        11,
        boldFont
    );

    if (
        selectedVehicle?.patente
    ) {

        drawText(
            `Patente: ${selectedVehicle.patente}`,
            315,
            clienteLabelY - 30,
            8,
            regularFont,
            DARK_GRAY
        );

    }

    y -= 42;


    /* =====================================================
       DETALLE
    ===================================================== */

    drawText(
        "DETALLE DEL ",
        MARGIN_X,
        y,
        9,
        boldFont
    );


    y -= 17;


    drawTableHeader();


    /* =====================================================
       CONCEPTOS
    ===================================================== */

    const validItems =
        budgetItems.filter(
            (item) =>
                item.name.trim() !== ""
        );


    if (
        validItems.length === 0
    ) {

        drawText(
            "Sin conceptos detallados.",
            TABLE_LEFT + 10,
            y,
            8.5,
            regularFont,
            GRAY
        );

        y -= 24;

    } else {

        validItems.forEach(
            (item) => {

                if (y < 85) {

                    createNewPage();

                    drawText(
                        "DETALLE DEL ",
                        MARGIN_X,
                        y,
                        9,
                        boldFont
                    );

                    y -= 17;

                    drawTableHeader();

                }


                const subtotal =
                    item.quantity *
                    item.price;


                let conceptName =
                    item.name.trim();


                if (
                    conceptName.length >
                    45
                ) {

                    conceptName =
                        conceptName.slice(
                            0,
                            42
                        ) + "...";

                }


                /*
                 * Primera columna con un poco más
                 * de margen interno.
                 */
                drawText(
                    conceptName,
                    TABLE_LEFT + 10,
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
                    String(
                        item.quantity
                    ),
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


                /*
                 * Separador ligeramente más abajo
                 * para darle aire al contenido.
                 */
                drawLine(
                    y - 9
                );


                y -= 25;

            }
        );

    }


    /* =====================================================
       RESUMEN
    ===================================================== */

    if (y < 190) {

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

    drawText(
        "Mano de obra",
        350,
        y,
        9,
        regularFont,
        DARK_GRAY
    );

    drawText(
        formatCurrency(
            laborCost
        ),
        485,
        y,
        9,
        boldFont
    );

    y -= 20;

    drawText(
        "Repuestos",
        350,
        y,
        9,
        regularFont,
        DARK_GRAY
    );

    drawText(
        formatCurrency(
            partsCost
        ),
        485,
        y,
        9,
        boldFont
    );

    y -= 14;

    drawLine(
        y,
        345,
        PAGE_WIDTH - MARGIN_X,
        1,
        LIGHT_GRAY
    );

    y -= 22;

    drawText(
        "TOTAL",
        345,
        y,
        11,
        boldFont
    );

    drawText(
        formatCurrency(
            budgetTotal
        ),
        475,
        y,
        13,
        boldFont
    );


    /* =====================================================
       ADELANTO Y SALDO
    ===================================================== */

    if (advancePayment && advancePayment.importe > 0) {
        y -= 32;

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
                advancePayment.importe
            ),
            485,
            y,
            10,
            boldFont,
            rgb(0.16, 0.7, 0.38)
        );

        y -= 20;

        drawText(
            `Medio: ${advancePayment.medioPago}`,
            345,
            y,
            7.5,
            regularFont,
            GRAY
        );

        drawText(
            `Fecha: ${formatDate(
                advancePayment.fecha
            )}`,
            460,
            y,
            7.5,
            regularFont,
            GRAY
        );

        y -= 18;

        drawLine(
            y,
            345,
            PAGE_WIDTH - MARGIN_X,
            1,
            LIGHT_GRAY
        );

        y -= 22;

        drawText(
            "SALDO PENDIENTE",
            345,
            y,
            11,
            boldFont,
            rgb(0.85, 0.2, 0.2)
        );

        const balanceAmount =
            remainingBalance !== undefined
                ? remainingBalance
                : budgetTotal - advancePayment.importe;

        drawText(
            formatCurrency(
                Math.max(balanceAmount, 0)
            ),
            475,
            y,
            13,
            boldFont,
            rgb(0.85, 0.2, 0.2)
        );
    }


    /* =====================================================
       OBSERVACIONES
    ===================================================== */

    y -= 36;

    if (
        notes.trim()
    ) {

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
            notes
                .trim()
                .split("\n");


        noteLines.forEach(
            (line) => {

                const words =
                    line.split(" ");

                let currentLine =
                    "";

                const maxCharacters =
                    95;


                words.forEach(
                    (word) => {

                        const testLine =
                            currentLine
                                ? `${currentLine} ${word}`
                                : word;


                        if (
                            testLine.length >
                            maxCharacters
                        ) {

                            drawText(
                                currentLine,
                                MARGIN_X,
                                y,
                                8.5,
                                regularFont,
                                DARK_GRAY
                            );

                            y -= 14;

                            currentLine =
                                word;

                        } else {

                            currentLine =
                                testLine;

                        }

                    }
                );


                if (
                    currentLine
                ) {

                    drawText(
                        currentLine,
                        MARGIN_X,
                        y,
                        8.5,
                        regularFont,
                        DARK_GRAY
                    );

                    y -= 14;

                }

            }
        );

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
            x:
                PAGE_WIDTH -
                MARGIN_X,
            y: 45,
        },

        thickness: 0.7,

        color: LIGHT_GRAY,
    });


    drawText(
        "MORA MECÁNICA",
        MARGIN_X,
        28,
        7.5,
        boldFont,
        DARK_GRAY
    );


    drawText(
        " sujeto a vigencia indicada.",
        350,
        28,
        7,
        regularFont,
        GRAY
    );


    /* =====================================================
       GENERAR BYTES
    ===================================================== */

    return await pdf.save();
};


export default Pdf;

