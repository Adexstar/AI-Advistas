import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CreditCard, 
  Plus, 
  Crown, 
  Star,
  Download,
  Calendar,
  DollarSign
} from "lucide-react";

const Billing = () => {
  const [currentCredits] = useState(45);
  
  const creditPackages = [
    { credits: 50, price: 10, popular: false },
    { credits: 150, price: 25, popular: true },
    { credits: 350, price: 50, popular: false },
    { credits: 750, price: 100, popular: false }
  ];

  const subscriptionPlans = [
    {
      name: "Free",
      price: 0,
      credits: 10,
      features: ["10 starter credits", "Basic ad creation", "Single platform", "Standard analytics"],
      current: true
    },
    {
      name: "Standard",
      price: 22.99,
      credits: 100,
      features: ["100 monthly credits", "Advanced AI creation", "Multi-platform", "Detailed analytics", "Landing page builder"],
      current: false,
      popular: true
    },
    {
      name: "Premium",
      price: 15.99,
      credits: 250,
      features: ["250 monthly credits", "Premium AI capabilities", "All platforms", "Advanced analytics", "Priority support"],
      current: false
    }
  ];

  const transactionHistory = [
    { id: 1, date: "2024-01-15", type: "Credit Purchase", amount: "$25.00", credits: 150, status: "Completed" },
    { id: 2, date: "2024-01-10", type: "Subscription", amount: "$22.99", credits: 100, status: "Completed" },
    { id: 3, date: "2024-01-05", type: "Credit Usage", amount: "-", credits: -25, status: "Used" },
    { id: 4, date: "2024-01-01", type: "Credit Purchase", amount: "$10.00", credits: 50, status: "Completed" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Credits</h1>
        <p className="text-muted-foreground">Manage your credits, subscriptions, and payment history</p>
      </div>

      {/* Credit Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{currentCredits}</div>
              <p className="text-muted-foreground">Credits remaining</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Est. usage this month</p>
              <p className="text-lg font-semibold">~75 credits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {creditPackages.map((pkg, index) => (
              <motion.div
                key={pkg.credits}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative border rounded-lg p-4 ${pkg.popular ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Popular
                  </Badge>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold">{pkg.credits}</div>
                  <p className="text-sm text-muted-foreground mb-2">Credits</p>
                  <div className="text-lg font-semibold">${pkg.price}</div>
                  <p className="text-xs text-muted-foreground mb-4">${(pkg.price / pkg.credits).toFixed(3)} per credit</p>
                  <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                    <Plus className="mr-2 h-4 w-4" />
                    Purchase
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {subscriptionPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative border rounded-lg p-6 ${
                  plan.popular ? 'border-primary bg-primary/5' : 
                  plan.current ? 'border-green-500 bg-green-50' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Crown className="mr-1 h-3 w-3" />
                    Popular
                  </Badge>
                )}
                {plan.current && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                    Current Plan
                  </Badge>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="text-3xl font-bold">${plan.price}</div>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Star className="h-3 w-3 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : plan.name === "Free" ? "Downgrade" : "Upgrade"}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionHistory.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell className={transaction.credits > 0 ? "text-green-600" : "text-red-600"}>
                    {transaction.credits > 0 ? "+" : ""}{transaction.credits}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;