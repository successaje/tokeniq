import { Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const activities = [
    {
        id: 1,
        type: 'send',
        message: 'Sent 10,000 USDC → Moonbeam via XCM',
        time: '2 mins ago',
        icon: ArrowUpRight,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10'
    },
    {
        id: 2,
        type: 'allocate',
        message: 'Allocated 5,000 USDC → Astar staking',
        time: '15 mins ago',
        icon: RefreshCw,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 3,
        type: 'receive',
        message: 'Received yield from Acala',
        time: '1 hour ago',
        icon: ArrowDownRight,
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    }
];

export function XcmActivityLog() {
    return (
        <Card className="border-muted/60 shadow-sm mt-6">
            <CardHeader className="py-4 border-b">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium text-muted-foreground">Recent XCM Activity</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                            <div className={cn("p-2 rounded-full", activity.bg)}>
                                <activity.icon className={cn("h-4 w-4", activity.color)} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{activity.message}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
