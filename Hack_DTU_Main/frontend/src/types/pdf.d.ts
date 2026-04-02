declare module 'html2pdf.js' {
    interface Html2PdfOptions {
        margin?: number | number[];
        filename?: string;
        image?: { type?: string; quality?: number };
        html2canvas?: { scale?: number; useCORS?: boolean; logging?: boolean };
        jsPDF?: { unit?: string; format?: string; orientation?: string };
        pagebreak?: { mode?: string | string[] };
    }

    interface Html2PdfInstance {
        set(options: Html2PdfOptions): Html2PdfInstance;
        from(element: HTMLElement | string): Html2PdfInstance;
        toPdf(): Html2PdfInstance;
        get(type: string): any;
        save(): Promise<void>;
    }

    function html2pdf(): Html2PdfInstance;

    export default html2pdf;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs' {
    const workerSrc: string;
    export default workerSrc;
}
