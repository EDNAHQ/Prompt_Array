import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function BillingSection({ subscription }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageBilling = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      });

      if (error) throw error;

      // Redirect to Stripe Customer Portal
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription & Billing</CardTitle>
        <CardDescription>Manage your subscription and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Current Plan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subscription?.status === 'active' ? 'Premium Plan' : 'Free Plan'}
            </p>
          </div>
          <div>
            {subscription?.status === 'active' && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Active
              </p>
            )}
          </div>
        </div>

        {subscription?.current_period_end && (
          <div>
            <h3 className="font-medium">Next billing date</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
        )}

        <Button
          onClick={handleManageBilling}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Manage Billing'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
