import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";

interface ReferralCommission {
  id: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  is_recurring: boolean;
}

export default function ReferralCommissionsCard() {
  const { data: commissions, isLoading, refetch } = useQuery<ReferralCommission[]>({
    queryKey: ['/api/user/referrals/commissions'],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  const totalEarned = commissions?.reduce((sum, c) => sum + (c.status === 'paid' ? c.amount : 0), 0) || 0;
  const pendingAmount = commissions?.reduce((sum, c) => sum + (c.status === 'pending' ? c.amount : 0), 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Referral Commissions</CardTitle>
        <div className="flex items-center space-x-2">
          <button onClick={() => refetch()} className="p-1 hover:bg-accent rounded">
            <RefreshCw className="h-4 w-4" />
          </button>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Earned</span>
              <span className="font-medium">${totalEarned.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending Commissions</span>
              <span className="font-medium">${pendingAmount.toFixed(2)}</span>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Recent Commissions</h3>
              <div className="space-y-2">
                {commissions?.slice(0, 3).map(commission => (
                  <div key={commission.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span>${commission.amount.toFixed(2)}</span>
                      {commission.is_recurring && (
                        <Badge variant="secondary" className="ml-2">Recurring</Badge>
                      )}
                    </div>
                    <Badge 
                      variant={commission.status === 'paid' ? 'default' : 
                               commission.status === 'pending' ? 'secondary' : 'destructive'}>
                      {commission.status}
                    </Badge>
                  </div>
                ))}
                {commissions?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No commissions yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}