
import {
    PDFDocument,
    StandardFonts,
    rgb,
} from "pdf-lib";


/* =========================================================
   TIPOS
========================================================= */

interface PresupuestoPdfProps {

    numeroPresupuesto: string;

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

const PresupuestoPdf = async ({
    numeroPresupuesto,
    selectedClient,
    selectedVehicle,
    budgetItems,
    laborCost,
    partsCost,
    budgetTotal,
    notes,
    partsPdf,
    formatCurrency,
    formatDate,
}: PresupuestoPdfProps) => {

    /* =====================================================
       CREAR PDF FINAL
    ===================================================== */

    const pdf =
        await PDFDocument.create();


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
        color = LIGHT_GRAY
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

        drawText(
            "MORA MECÁNICA",
            MARGIN_X,
            PAGE_HEIGHT - 48,
            18,
            boldFont,
            BLACK
        );


        drawText(
            "PRESUPUESTO",
            PAGE_WIDTH - 160,
            PAGE_HEIGHT - 47,
            12,
            boldFont,
            DARK_GRAY
        );


        drawLine(
            PAGE_HEIGHT - 65,
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
            7.5,
            boldFont,
            WHITE
        );


        drawText(
            "TIPO",
            315,
            y - 15,
            7.5,
            boldFont,
            WHITE
        );


        drawText(
            "CANT.",
            375,
            y - 15,
            7.5,
            boldFont,
            WHITE
        );


        drawText(
            "PRECIO",
            420,
            y - 15,
            7.5,
            boldFont,
            WHITE
        );


        drawText(
            "IMPORTE",
            490,
            y - 15,
            7.5,
            boldFont,
            WHITE
        );


        /*
         * Dejamos más espacio debajo del TH
         * para que la primera fila no quede pegada.
         */
        y -= 34;

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

    drawText(
        `Presupuesto: ${numeroPresupuesto}`,
        MARGIN_X,
        y,
        9,
        boldFont
    );


    drawText(
        `Fecha: ${formatDate(
            new Date()
                .toISOString()
                .split("T")[0]
        )}`,
        300,
        y,
        9,
        regularFont,
        DARK_GRAY
    );


    y -= 28;


    /* =====================================================
       CLIENTE
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
        selectedClient?.nombre ||
            "Sin cliente",
        MARGIN_X,
        y,
        10,
        boldFont
    );


    if (
        selectedClient?.email
    ) {

        drawText(
            selectedClient.email,
            MARGIN_X,
            y - 14,
            8.5,
            regularFont,
            DARK_GRAY
        );

    }


    /* =====================================================
       VEHÍCULO
    ===================================================== */

    drawText(
        "VEHÍCULO",
        315,
        y + 14,
        8,
        boldFont,
        GRAY
    );


    drawText(
        selectedVehicle
            ? `${selectedVehicle.marca} ${selectedVehicle.modelo}`
            : "Sin vehículo",
        315,
        y,
        10,
        boldFont
    );


    if (
        selectedVehicle?.patente
    ) {

        drawText(
            `Patente: ${selectedVehicle.patente}`,
            315,
            y - 14,
            8.5,
            regularFont,
            DARK_GRAY
        );

    }


    y -= 48;


    /* =====================================================
       DETALLE
    ===================================================== */

    drawText(
        "DETALLE DEL PRESUPUESTO",
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
                        "DETALLE DEL PRESUPUESTO",
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


    y -= 12;


    drawText(
        "RESUMEN DE COSTOS",
        MARGIN_X,
        y,
        9,
        boldFont
    );


    y -= 24;


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
        regularFont
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
        regularFont
    );


    y -= 12;


    drawLine(
        y,
        345,
        PAGE_WIDTH - MARGIN_X,
        1,
        BLACK
    );


    y -= 25;


    drawText(
        "TOTAL PRESUPUESTADO",
        345,
        y,
        10,
        boldFont
    );


    drawText(
        formatCurrency(
            budgetTotal
        ),
        475,
        y,
        12,
        boldFont
    );


    /* =====================================================
       OBSERVACIONES
    ===================================================== */

    y -= 45;


    if (
        notes.trim()
    ) {

        drawText(
            "OBSERVACIONES",
            MARGIN_X,
            y,
            9,
            boldFont
        );


        y -= 17;


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
        "Presupuesto sujeto a vigencia indicada.",
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


export default PresupuestoPdf;

