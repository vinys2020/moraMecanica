import DocumentoPDF from "../components/DocumentoPDF";

interface GenerarPDFOptions {
    tipo: "Presupuesto" | "Recibo" | "Factura" | "Comprobante";
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
    items?: {
        type: "Servicio" | "Repuesto";
        name: string;
        quantity: number;
        price: number;
    }[];
    laborCost?: number;
    partsCost?: number;
    total: number;
    observaciones?: string;
    adelanto?: {
        importe: number;
        medioPago: string;
        fecha: string;
    };
    saldoPendiente?: number;
    nombrePDF: string;
}

// Formateadores
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

export const generarYDescargarPDF = async (
    options: GenerarPDFOptions
) => {
    try {
        const pdfBytes = await DocumentoPDF({
            tipo: options.tipo,
            numero: options.numero,
            fecha: options.fecha,
            cliente: options.cliente,
            vehiculo: options.vehiculo,
            items: options.items || [],
            laborCost: options.laborCost || 0,
            partsCost: options.partsCost || 0,
            total: options.total,
            observaciones: options.observaciones,
            adelanto: options.adelanto,
            saldoPendiente: options.saldoPendiente,
            formatCurrency,
            formatDate,
        });

        // Crear blob
        const pdfBlob = new Blob([pdfBytes as BlobPart], {
            type: "application/pdf",
        });

        // Descargar
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = options.nombrePDF;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(pdfUrl);

        return true;
    } catch (error) {
        console.error("Error generando PDF:", error);
        throw error;
    }
};
