import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/date-utils'
import { RecentOrder } from '@/lib/dashboard-data'

interface RecentOrdersTableProps {
  data: RecentOrder[]
}

export function RecentOrdersTable({ data }: RecentOrdersTableProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{formatDate(order.orderDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{order.receiptFilename}</TableCell>
                  <TableCell className="text-right">{order.itemCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}


