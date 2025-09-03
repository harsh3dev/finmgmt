"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Key, 
  Plus,
  AlertCircle,
  Shield
} from "lucide-react";
import { ApiKey } from "@/store/slices/apiKeySlice";
import { ApiKeyCard } from "./api-key-card";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  loading?: boolean;
  onEdit: (apiKey: ApiKey) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string, service: string) => void;
  onAdd: () => void;
  onTest?: (apiKey: ApiKey) => Promise<boolean>;
}

const API_SERVICES = [
  { value: "all", label: "All Services" },
  { value: "alpha_vantage", label: "Alpha Vantage" },
  { value: "yahoo_finance", label: "Yahoo Finance" },
  { value: "polygon", label: "Polygon.io" },
  { value: "finnhub", label: "Finnhub" },
  { value: "fmp", label: "Financial Modeling Prep" },
  { value: "quandl", label: "Quandl" },
  { value: "custom", label: "Custom API" },
];

export function ApiKeyList({
  apiKeys,
  loading = false,
  onEdit,
  onDelete,
  onSetDefault,
  onAdd,
  onTest
}: ApiKeyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");

  // Filter and search API keys
  const filteredApiKeys = apiKeys.filter((apiKey) => {
    const matchesSearch = 
      apiKey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apiKey.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apiKey.description && apiKey.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesService = serviceFilter === "all" || apiKey.service === serviceFilter;
    
    return matchesSearch && matchesService;
  });

  // Group by service for better organization
  const groupedApiKeys = filteredApiKeys.reduce((acc, apiKey) => {
    if (!acc[apiKey.service]) {
      acc[apiKey.service] = [];
    }
    acc[apiKey.service].push(apiKey);
    return acc;
  }, {} as Record<string, ApiKey[]>);

  // Get service statistics
  const serviceStats = apiKeys.reduce((acc, apiKey) => {
    acc[apiKey.service] = (acc[apiKey.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getServiceLabel = (service: string) => {
    const serviceObj = API_SERVICES.find(s => s.value === service);
    return serviceObj?.label || service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!apiKeys.length) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No API Keys Found</CardTitle>
          <CardDescription>
            You haven&apos;t added any API keys yet. Add your first API key to start accessing financial data.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First API Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search API keys by name, service, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_SERVICES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.label}</span>
                        {service.value !== "all" && serviceStats[service.value] && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {serviceStats[service.value]}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Keys</p>
                <p className="text-2xl font-bold text-foreground">{apiKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(serviceStats).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Default Keys</p>
                <p className="text-2xl font-bold text-foreground">
                  {apiKeys.filter(key => key.isDefault).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {(searchTerm || serviceFilter !== "all") && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredApiKeys.length} of {apiKeys.length} API keys
            {searchTerm && ` matching "${searchTerm}"`}
            {serviceFilter !== "all" && ` for ${getServiceLabel(serviceFilter)}`}
          </span>
          {(searchTerm || serviceFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setServiceFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* API Keys Grid */}
      {filteredApiKeys.length === 0 ? (
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">No API keys found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search terms or filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setServiceFilter("all");
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedApiKeys).map(([service, keys]) => (
            <div key={service}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {getServiceLabel(service)}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {keys.length} key{keys.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {keys.map((apiKey) => (
                  <ApiKeyCard
                    key={apiKey.id}
                    apiKey={apiKey}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSetDefault={onSetDefault}
                    onTest={onTest}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
