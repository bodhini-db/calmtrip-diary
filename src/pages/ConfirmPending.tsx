import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ConfirmPending() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Check your email!</CardTitle>
          <CardDescription>
            We sent a confirmation link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account.
          </p>
          <Link to="/">
            <Button variant="default" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
