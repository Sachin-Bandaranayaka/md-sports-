import { redirect } from 'next/navigation';

interface PageProps {
    params: {
        id: string;
    };
}

export default function EditReceiptPage({ params }: PageProps) {
    // Since the edit functionality is built into the detail page,
    // redirect to the detail page
    redirect(`/receipts/${params.id}/detail`);
} 