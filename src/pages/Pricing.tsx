import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';
import { Seo } from '@/components/Seo';
import { PricingGrid } from '@/components/landing/PricingGrid';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCtaClick = () => {
    navigate(user ? '/studio' : '/login?redirect=/pricing');
  };

  const handleContactSales = () => {
    window.location.href = 'mailto:support@realpathlearning.com?subject=District%20Plan%20Inquiry';
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Pricing — RealPath Learning"
        description="Simple plans for educators, schools, and districts. WCAG 2.1 AA compliant differentiated lessons starting at $19/month."
        path="/pricing"
      />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="medium" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/studio">
                <Button variant="outline">Go to Studio</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="container mx-auto px-4 pt-16 pb-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full power of differentiated learning. Every plan includes WCAG 2.1 AA compliance built in.
          </p>
        </div>

        <PricingGrid onCtaClick={handleCtaClick} onContactSales={handleContactSales} />

        <div className="container mx-auto px-4 pb-16 text-center">
          <p className="text-muted-foreground">
            Questions? <a href="mailto:support@realpathlearning.com" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </main>
    </div>
  );
}
