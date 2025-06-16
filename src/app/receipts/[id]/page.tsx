import { redirect } from 'next/navigation';

interface PageProps {
    params: {
        id: string;
    };
}

export default function ReceiptPage({ params }: PageProps) {
    // Redirect to the detail view by default
    redirect(`/receipts/${params.id}/detail`);
}