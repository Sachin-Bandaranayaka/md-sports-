import { Suspense } from 'react';
import { SimplePaymentClientForm, Loading } from './simple-payment-client';

export default function SimplePaymentPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SimplePaymentClientForm />
        </Suspense>
    );
} 