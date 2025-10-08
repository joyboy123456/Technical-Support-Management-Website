import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function DeviceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* 封面图骨架 */}
      <Skeleton className="w-full h-40 rounded-t-xl rounded-b-none" />
      
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 mt-2" />
      </CardHeader>
      
      <CardContent className="pt-0 px-4 pb-4 space-y-2">
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        
        {/* 墨水余量骨架 */}
        <div className="pt-3 border-t">
          <Skeleton className="h-3 w-16 mb-2" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-3 w-4 mb-1" />
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-3 w-8 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
