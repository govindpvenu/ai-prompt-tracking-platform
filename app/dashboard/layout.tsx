import Header from '@/components/layout/header';

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="">
            <Header />
            {children}
        </main>
    );
}
