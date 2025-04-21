import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({ children, title, description, ...props }: { children: React.ReactNode; title?: React.ReactNode; description?: React.ReactNode }) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
