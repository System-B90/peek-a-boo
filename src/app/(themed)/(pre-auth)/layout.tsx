export default function PreAuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="w-full h-full flex flex-row items-center content-center justify-center">
            {children}
        </div>
    )
}