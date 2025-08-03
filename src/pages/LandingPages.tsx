import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Eye,
  Edit,
  Copy,
  BarChart3,
  Search,
  Globe,
  Calendar
} from "lucide-react";

const LandingPages = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const landingPages = [
    {
      id: 1,
      name: "Summer Sale Landing",
      slug: "summer-sale-2024",
      status: "Published",
      visits: 1250,
      conversions: 42,
      conversionRate: 3.4,
      lastModified: "2024-01-15",
      template: "E-commerce"
    },
    {
      id: 2,
      name: "Product Launch Page",
      slug: "new-product-launch",
      status: "Draft",
      visits: 0,
      conversions: 0,
      conversionRate: 0,
      lastModified: "2024-01-14",
      template: "Product Launch"
    },
    {
      id: 3,
      name: "Newsletter Signup",
      slug: "newsletter-signup",
      status: "Published",
      visits: 850,
      conversions: 127,
      conversionRate: 14.9,
      lastModified: "2024-01-12",
      template: "Lead Generation"
    }
  ];

  const templates = [
    {
      id: 1,
      name: "E-commerce Hero",
      category: "E-commerce",
      preview: "/api/placeholder/300/200",
      description: "Perfect for product launches and sales campaigns"
    },
    {
      id: 2,
      name: "Lead Generation",
      category: "Lead Gen",
      preview: "/api/placeholder/300/200",
      description: "Optimized for email capture and lead generation"
    },
    {
      id: 3,
      name: "SaaS Product",
      category: "SaaS",
      preview: "/api/placeholder/300/200",
      description: "Ideal for software and service presentations"
    },
    {
      id: 4,
      name: "Event Landing",
      category: "Events",
      preview: "/api/placeholder/300/200",
      description: "Great for webinars and event registrations"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published": return "bg-green-100 text-green-700";
      case "Draft": return "bg-yellow-100 text-yellow-700";
      case "Archived": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredPages = landingPages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">Create and manage high-converting landing pages</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Landing Page
        </Button>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Choose a Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Template Preview</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <Button size="sm" className="w-full">Use Template</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Pages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Landing Pages</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>URL Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Conv. Rate</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{page.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(page.status)}>
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{page.visits.toLocaleString()}</TableCell>
                  <TableCell>{page.conversions}</TableCell>
                  <TableCell>{page.conversionRate}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {page.lastModified}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{landingPages.length}</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{landingPages.reduce((sum, page) => sum + page.visits, 0).toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {(landingPages.reduce((sum, page) => sum + page.conversionRate, 0) / landingPages.length).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandingPages;
